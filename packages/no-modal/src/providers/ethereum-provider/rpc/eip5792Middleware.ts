import {
  EIP_5792_METHODS,
  type Eip5792GetCallsStatusParams,
  type Eip5792GetCallsStatusResponse,
  type Eip5792GetCapabilitiesParams,
  type Eip5792GetCapabilitiesResponse,
  type Eip5792SendCallsParams,
  type Eip5792ShowCallsStatusParams,
  EthereumTransactionMeta,
  type GetEthCodeFn,
  walletGetCallsStatus,
  walletGetCapabilities,
  type WalletGetCapabilitiesContext,
  walletSendCalls,
  type WalletSendCallsContext,
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

import { createGetEthCode } from "./ethRpcMiddlewares";
import { TransactionParams } from "./interfaces";

export interface IEip5792MiddlewareOptions {
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
  processTransaction?: (txParams: TransactionParams, req: JRPCRequest<unknown>) => Promise<string>;
  processTransactionBatch?: WalletSendCallsContext["processTransactionBatch"];
  getTransactionByBatchId?: (batchId: string) => EthereumTransactionMeta;
  eip5792Config?: {
    getSupportedChains: () => `0x${string}`[];
    getCachedDelegations?: () => Record<string, `0x${string}` | null>;
    updateDelegationCache?: (walletAddress: `0x${string}`, chainId: `0x${string}`, delegation: `0x${string}` | null) => void;
  };
}

/**
 * Creates EIP-5792 middleware that handles:
 * - `wallet_sendCalls`: Sends a batch of calls (EIP-5792).
 * - `wallet_getCallsStatus`: Returns the status of a batch of calls.
 * - `wallet_showCallsStatus`: Shows the status of a batch of calls (no-op, returns null).
 * - `wallet_getCapabilities`: Returns capabilities per chain for the wallet.
 *
 * Uses handler functions from `@toruslabs/ethereum-controllers` for validation, batch processing,
 * status tracking, and capability reporting.
 */
export function createEip5792Middleware({
  getProviderEngineProxy,
  processTransaction: processTransactionHandler,
  processTransactionBatch,
  getTransactionByBatchId,
  eip5792Config,
}: IEip5792MiddlewareOptions): JRPCMiddleware<unknown, unknown> {
  const getEthCode: GetEthCodeFn = createGetEthCode(getProviderEngineProxy);

  // --- wallet_sendCalls ---
  async function sendCalls(req: JRPCRequest<Eip5792SendCallsParams>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processTransactionHandler) {
      throw rpcErrors.methodNotSupported();
    }
    if (!processTransactionBatch) {
      throw rpcErrors.methodNotSupported();
    }

    const context: WalletSendCallsContext = {
      processTransaction: (txParams, req) => {
        const formattedTxParams: TransactionParams = {
          ...txParams,
          type: txParams.type != null ? Number(txParams.type) : undefined,
          nonce: txParams.nonce != null ? Number(txParams.nonce) : undefined,
          authorizationList: txParams.authorizationList?.map(({ address, chainId, nonce, r, s, yParity }) => ({
            address,
            chainId: BigInt(chainId),
            nonce: nonce != null ? BigInt(nonce) : BigInt(0),
            signature: Signature.from({ r: r ?? "0x0", s: s ?? "0x0", yParity: (yParity ? Number(yParity) : 0) as 0 | 1 }),
          })),
        };
        return processTransactionHandler(formattedTxParams, req);
      },
      processTransactionBatch,
    };

    const result = await walletSendCalls(req, getEthCode, context);
    res.result = result;
  }

  // --- wallet_getCallsStatus ---
  async function getCallsStatus(req: JRPCRequest<[Eip5792GetCallsStatusParams]>, res: JRPCResponse<Eip5792GetCallsStatusResponse>): Promise<void> {
    if (!getTransactionByBatchId) {
      throw rpcErrors.methodNotSupported();
    }

    const result = walletGetCallsStatus(req, getTransactionByBatchId);
    res.result = result;
  }

  // --- wallet_showCallsStatus ---
  async function showCallsStatus(_req: JRPCRequest<[Eip5792ShowCallsStatusParams]>, res: JRPCResponse<unknown>): Promise<void> {
    // wallet_showCallsStatus is a display-only method that asks the wallet to show
    // the status of a batch to the user. In an embedded/no-modal context, this is a no-op.
    res.result = null;
  }

  // --- wallet_getCapabilities ---
  async function getCapabilities(req: JRPCRequest<Eip5792GetCapabilitiesParams>, res: JRPCResponse<Eip5792GetCapabilitiesResponse>): Promise<void> {
    if (!eip5792Config) {
      throw rpcErrors.methodNotSupported();
    }

    const context: WalletGetCapabilitiesContext = {
      getSupportedChains: eip5792Config.getSupportedChains,
      getCachedDelegations: eip5792Config.getCachedDelegations,
      updateDelegationCache: eip5792Config.updateDelegationCache,
    };

    const result = await walletGetCapabilities(req, getEthCode, context);
    res.result = result;
  }

  return createScaffoldMiddleware({
    [EIP_5792_METHODS.WALLET_SEND_CALLS]: createAsyncMiddleware(sendCalls) as JRPCMiddleware<unknown, unknown>,
    [EIP_5792_METHODS.WALLET_GET_CALLS_STATUS]: createAsyncMiddleware(getCallsStatus) as JRPCMiddleware<unknown, unknown>,
    [EIP_5792_METHODS.WALLET_SHOW_CALLS_STATUS]: createAsyncMiddleware(showCallsStatus) as JRPCMiddleware<unknown, unknown>,
    [EIP_5792_METHODS.WALLET_GET_CAPABILITIES]: createAsyncMiddleware(getCapabilities) as JRPCMiddleware<unknown, unknown>,
  });
}
