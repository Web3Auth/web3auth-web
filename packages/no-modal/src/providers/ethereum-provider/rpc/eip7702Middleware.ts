import {
  DUMMY_AUTHORIZATION_SIGNATURE,
  EIP_7702_METHODS,
  type Eip5792SendCallsParams,
  type Eip7702Params,
  type Eip7702WalletGetUpgradeStatusResponse,
  generateBatchId,
  generateEIP7702BatchTransaction,
  getDelegationAddress,
  getIsEip7702UpgradeSupported,
  MetaMask_EIP7702_Stateless_Delegator,
  type TransactionBatchRequest,
} from "@toruslabs/ethereum-controllers";
import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  rpcErrors,
  SafeEventEmitterProvider,
} from "@web3auth/auth";
import { type Authorization, getAddress, hashAuthorization, Signature } from "ethers";

import { TRANSACTION_ENVELOPE_TYPES } from "../providers";
import { createGetEthCode } from "./ethRpcMiddlewares";
import type { TransactionParams } from "./interfaces";

export type SignAuthorizationHashFn = (authorizationHash: string) => Promise<{ v: number; r: string; s: string }>;

/**
 * Signs EIP-7702 authorization entries in a transaction's authorizationList.
 * For each authorization with a dummy (placeholder) signature, it computes the
 * EIP-7702 authorization hash (keccak256(0x05 || rlp([chainId, address, nonce])))
 * and delegates actual signing to the provided `signHash` callback.
 *
 * @param txParams - Transaction params containing an optional `authorizationList`.
 * @param signHash - Callback that signs a hex-encoded authorization hash and returns v, r, s.
 * @returns Updated txParams with signed Authorization objects.
 */
export async function signAuthorizationList(
  txParams: TransactionParams & { gas?: string },
  signHash: SignAuthorizationHashFn
): Promise<TransactionParams & { gas?: string }> {
  const { authorizationList, nonce } = txParams;

  if (!authorizationList || authorizationList.length === 0) {
    return txParams;
  }

  const signedAuthorizationList: Authorization[] = [];

  for (const authorization of authorizationList) {
    // Normalize authorization fields before hashing
    const address = getAddress(authorization.address);
    const chainId = BigInt(authorization.chainId);
    const authorizationNonce = authorization.nonce !== null && authorization.nonce !== undefined ? authorization.nonce : BigInt(nonce + 1);
    if (authorizationNonce === undefined) {
      throw rpcErrors.invalidRequest({ message: "Nonce is required for signing EIP-7702 authorization" });
    }

    // EIP-7702 authorization hash: keccak256(0x05 || rlp([chainId, address, nonce]))
    const authorizationHash = hashAuthorization({
      nonce: authorizationNonce,
      address,
      chainId,
    });

    const { v, r, s } = await signHash(authorizationHash);
    // Normalize v: may be 0/1 or 27/28, convert to yParity 0/1
    const yParity: 0 | 1 = (v > 1 ? v - 27 : v) as 0 | 1;

    signedAuthorizationList.push({
      address,
      chainId,
      nonce: authorizationNonce,
      signature: Signature.from({ yParity, r, s }),
    });
  }

  return { ...txParams, authorizationList: signedAuthorizationList };
}

/**
 * Builds a transaction from a batch request (EIP-5792 `wallet_sendCalls`).
 *
 * - Single call: unwrapped into a normal transaction.
 * - Multiple calls: encoded into a single EIP-7821 batch execute call.
 * - If an EIP-7702 upgrade is required, the transaction is built as a type-4
 *   (SET_CODE) tx with an unsigned authorization list so the upgrade and
 *   batch execute happen atomically.
 *
 * @param batchRequest - The batch request containing transactions and optional upgrade info.
 * @param sendCallsParams - The EIP-5792 send calls parameters (from, chainId, etc.).
 * @returns The built txParams and the batchId.
 */
export function createEIP7702BatchTransaction(
  batchRequest: TransactionBatchRequest,
  sendCallsParams: Eip5792SendCallsParams
): { txParams: TransactionParams & { gas?: string }; batchId: string } {
  const { from, chainId } = sendCallsParams;
  const { transactions, requiredEip7702Upgrade, eip7702UpgradeContractAddress } = batchRequest;
  const batchId = batchRequest.batchId ?? generateBatchId();

  let txParams: TransactionParams & { gas?: string };

  if (transactions.length === 1) {
    // Single transaction: unwrap and process as a normal transaction
    txParams = {
      from,
      to: transactions[0].params.to,
      value: transactions[0].params.value || "0x0",
      data: transactions[0].params.data || "0x",
      chainId,
    };
  } else {
    // Multiple transactions: encode as a single EIP-7821 batch execute call
    const nestedTxParams = transactions.map((tx) => tx.params);
    const batchTransaction = generateEIP7702BatchTransaction(from as `0x${string}`, nestedTxParams);

    txParams = {
      from,
      to: batchTransaction.to,
      data: batchTransaction.data,
      value: batchTransaction.value || "0x0",
    };

    if (requiredEip7702Upgrade) {
      if (!eip7702UpgradeContractAddress) {
        throw rpcErrors.invalidParams("Delegation address is required for EIP-7702 upgrade");
      }
      // Send as type-4 (SET_CODE) transaction with authorization list
      // so the EIP-7702 upgrade and batch execute happen atomically.
      txParams.type = Number.parseInt(TRANSACTION_ENVELOPE_TYPES.SET_CODE, 16);
      txParams.authorizationList = [
        {
          address: eip7702UpgradeContractAddress,
          chainId: BigInt(chainId),
          signature: Signature.from({
            r: DUMMY_AUTHORIZATION_SIGNATURE,
            s: DUMMY_AUTHORIZATION_SIGNATURE,
            yParity: 0,
          }),
        } as Authorization, // nonce is intentionally omitted here, the nonce will be computed in later middlewares
      ];
    }
  }

  return { txParams, batchId };
}

export interface IEip7702MiddlewareOptions {
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
  processTransaction?: (txParams: TransactionParams, req: JRPCRequest<unknown>) => Promise<string>;
}

/**
 * Creates EIP-7702 middleware that handles:
 * - `wallet_getAccountUpgradeStatus`: Checks if an account supports EIP-7702 upgrade and its delegation status.
 * - `wallet_upgradeAccount`: Upgrades an EOA by sending a setCode (type 4) transaction with an authorization list.
 *
 * Uses utilities from `@toruslabs/ethereum-controllers` for delegation address detection and upgrade support checks.
 */
export function createEip7702Middleware({ getProviderEngineProxy, processTransaction }: IEip7702MiddlewareOptions): JRPCMiddleware<unknown, unknown> {
  const getEthCode = createGetEthCode(getProviderEngineProxy);

  async function getAccountUpgradeStatus(req: JRPCRequest<Eip7702Params[]>, res: JRPCResponse<unknown>): Promise<void> {
    const params = req.params?.[0];
    if (!params) {
      throw rpcErrors.invalidParams({ message: "Missing params for wallet_getAccountUpgradeStatus" });
    }

    const { account, chainId } = params;
    if (!account || !chainId) {
      throw rpcErrors.invalidParams({ message: "Missing account or chainId" });
    }

    const result = await getIsEip7702UpgradeSupported(account, chainId, getEthCode);

    const delegationAddress = await getDelegationAddress(account, chainId, getEthCode);

    const response: Eip7702WalletGetUpgradeStatusResponse = {
      isUpgraded: delegationAddress !== null,
      implementation: delegationAddress || ("0x" as `0x${string}`),
    };

    res.result = {
      ...result,
      ...response,
    };
  }

  async function upgradeAccount(req: JRPCRequest<Eip7702Params[]>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processTransaction) {
      throw rpcErrors.methodNotSupported();
    }

    const params = req.params?.[0];
    if (!params) {
      throw rpcErrors.invalidParams({ message: "Missing params for wallet_upgradeAccount" });
    }

    const { account, chainId, implementation } = params;
    if (!account || !chainId) {
      throw rpcErrors.invalidParams({ message: "Missing account or chainId" });
    }

    // Use provided implementation or default to MetaMask EIP-7702 Stateless Delegator
    const delegationTarget = implementation || MetaMask_EIP7702_Stateless_Delegator;

    // Check current delegation status
    const delegationAddress = await getDelegationAddress(account, chainId, getEthCode);
    if (delegationAddress && delegationAddress.toLowerCase() === delegationTarget.toLowerCase()) {
      // Already delegated to the target
      res.result = null;
      return;
    }

    // Build the setCode (type 4) transaction with authorization list.
    // nonce is intentionally omitted so that signAuthorizationList's
    // nullish-coalescing fallback (authorization.nonce ?? Number(nonce) + 1) computes
    // the correct authorization nonce from the transaction nonce.
    const txParams: TransactionParams = {
      from: account,
      to: account, // setCode transactions target the sender
      data: "0x",
      value: "0x0",
      type: Number.parseInt(TRANSACTION_ENVELOPE_TYPES.SET_CODE, 16),
      authorizationList: [
        {
          address: delegationTarget,
          chainId: BigInt(chainId),
          signature: Signature.from({
            r: DUMMY_AUTHORIZATION_SIGNATURE,
            s: DUMMY_AUTHORIZATION_SIGNATURE,
            yParity: 0,
          }),
        } as Authorization, // nonce is intentionally omitted here, the nonce will be computed in later middlewares
      ],
    };

    res.result = await processTransaction(txParams, req);
  }

  return createScaffoldMiddleware({
    [EIP_7702_METHODS.WALLET_GET_ACCOUNT_UPGRADE_STATUS]: createAsyncMiddleware(getAccountUpgradeStatus) as JRPCMiddleware<unknown, unknown>,
    [EIP_7702_METHODS.WALLET_UPGRADE_ACCOUNT]: createAsyncMiddleware(upgradeAccount) as JRPCMiddleware<unknown, unknown>,
  });
}
