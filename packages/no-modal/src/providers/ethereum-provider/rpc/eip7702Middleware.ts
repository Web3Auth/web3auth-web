import { zeroAddress } from "@ethereumjs/util";
import {
  EIP_7702_METHODS,
  type Eip7702Params,
  type Eip7702WalletGetUpgradeStatusResponse,
  getDelegationAddress,
  type GetEthCodeFn,
  getIsEip7702UpgradeSupported,
  MetaMask_EIP7702_Stateless_Delegator,
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
import { Signature } from "ethers";

import type { TransactionParams } from "./interfaces";

export interface IEip7702MiddlewareOptions {
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
  processTransaction?: (txParams: TransactionParams, req: JRPCRequest<unknown>) => Promise<string>;
}

/**
 * Creates a `getEthCode` function that uses the provider engine proxy to call `eth_getCode`.
 * Implements the `GetEthCodeFn` type from `@toruslabs/ethereum-controllers`.
 */
export function createGetEthCode(getProviderEngineProxy: () => SafeEventEmitterProvider | null): GetEthCodeFn {
  return async (address: `0x${string}`, _chainId: `0x${string}`): Promise<`0x${string}`> => {
    const provider = getProviderEngineProxy();
    if (!provider) {
      throw rpcErrors.internal({ message: "Provider is not initialized" });
    }
    const code = await provider.request<[string, string], string>({
      method: "eth_getCode",
      params: [address, "latest"],
    });
    return (code || "0x") as `0x${string}`;
  };
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

    const dummyAuthorizationSignature = Signature.from({
      r: zeroAddress(),
      s: zeroAddress(),
      yParity: 0,
    });

    // Build the setCode (type 4) transaction with authorization list
    const txParams: TransactionParams = {
      from: account,
      to: account, // setCode transactions target the sender
      data: "0x",
      value: "0x0",
      type: 4,
      authorizationList: [
        {
          address: delegationTarget,
          chainId: BigInt(chainId),
          nonce: BigInt(0), // Will be filled by the signing process
          signature: dummyAuthorizationSignature,
        },
      ],
    };

    res.result = await processTransaction(txParams, req);
  }

  return createScaffoldMiddleware({
    [EIP_7702_METHODS.WALLET_GET_ACCOUNT_UPGRADE_STATUS]: createAsyncMiddleware(getAccountUpgradeStatus) as JRPCMiddleware<unknown, unknown>,
    [EIP_7702_METHODS.WALLET_UPGRADE_ACCOUNT]: createAsyncMiddleware(upgradeAccount) as JRPCMiddleware<unknown, unknown>,
  });
}
