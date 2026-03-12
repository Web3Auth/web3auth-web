import type { Eip5792GetCapabilitiesParams, Eip5792SendCallsParams } from "@toruslabs/ethereum-controllers";
import { createScaffoldMiddlewareV2, type JRPCRequest, rpcErrors } from "@web3auth/auth";
import { isHex, toHex } from "viem";

import type { MessageParams, TransactionParams, TypedMessageParams, WalletMiddlewareOptions } from "./interfaces";

export function createWalletMiddlewareV2({
  getAccounts,
  getPrivateKey,
  getPublicKey,
  processEthSignMessage,
  processPersonalMessage,
  processTransaction,
  processSignTransaction,
  processTypedMessageV4,
  processGetCapabilities,
  processSendCalls,
  processGetCallsStatus,
  processShowCallsStatus,
}: WalletMiddlewareOptions) {
  if (!getAccounts) throw new Error("opts.getAccounts is required");

  async function validateAndNormalizeKeyholder(address: string, req: JRPCRequest<unknown>): Promise<string> {
    if (typeof address === "string" && address.length > 0) {
      const accounts = await getAccounts(req);
      const normalizedAddress = address.toLowerCase();
      if (accounts.map((a) => a.toLowerCase()).includes(normalizedAddress)) return normalizedAddress;
    }
    throw rpcErrors.invalidParams({ message: `Invalid parameters: must provide an Ethereum address.` });
  }

  type Params = { request: JRPCRequest<unknown>; next: (r?: JRPCRequest<unknown>) => Promise<unknown> };

  async function getWalletCapabilitiesMiddleware(req: JRPCRequest<unknown>) {
    if (!processGetCapabilities) throw rpcErrors.methodNotSupported();
    if (!Array.isArray(req.params) || req.params.length === 0) throw rpcErrors.invalidParams("Invalid parameters");
    const account = req.params[0] as string;
    if (!isHex(account)) throw rpcErrors.invalidParams("Invalid account address");
    let chainIds = req.params[1] || [];
    if (!Array.isArray(chainIds)) throw rpcErrors.invalidParams(`Invalid params, received: ${chainIds}. expected: Array`);
    chainIds = chainIds.map((chainId: string) => (isHex(chainId) ? chainId : toHex(chainId)));
    const getCapabilitiesParams: Eip5792GetCapabilitiesParams = [account, chainIds];
    return processGetCapabilities(getCapabilitiesParams);
  }

  async function walletSendCallsMiddleware(req: JRPCRequest<unknown>) {
    if (!processSendCalls) throw rpcErrors.methodNotSupported();
    const params = Array.isArray(req.params) ? req.params[0] : req.params;
    if (!params || typeof params !== "object") throw rpcErrors.invalidParams("Missing or invalid params for wallet_sendCalls");
    if (!params.version || typeof params.version !== "string")
      throw rpcErrors.invalidParams(`Invalid version: expected string, got "${params.version || "undefined"}"`);
    if (!params.chainId) throw rpcErrors.invalidParams("Missing required field: chainId");
    if (!Array.isArray(params.calls) || params.calls.length === 0) throw rpcErrors.invalidParams("calls must be a non-empty array");
    const from = params.from as string | undefined;
    if (from) await validateAndNormalizeKeyholder(from, req);
    const walletSendCallsParams: Eip5792SendCallsParams = {
      ...params,
      chainId: isHex(params.chainId) ? params.chainId : toHex(params.chainId),
    };
    return processSendCalls(walletSendCallsParams);
  }

  async function walletBatchCallStatusMiddleware(req: JRPCRequest<unknown>) {
    if (!processGetCallsStatus) throw rpcErrors.methodNotSupported();
    const batchId = Array.isArray(req.params) ? req.params[0] : (req.params as string);
    if (!batchId || typeof batchId !== "string") throw rpcErrors.invalidParams("Missing or invalid batchId");
    return processGetCallsStatus(batchId);
  }

  async function walletShowCallsStatusMiddleware(req: JRPCRequest<unknown>) {
    if (!processShowCallsStatus) throw rpcErrors.methodNotSupported();
    const batchId = Array.isArray(req.params) ? req.params[0] : (req.params as string);
    if (!batchId || typeof batchId !== "string") throw rpcErrors.invalidParams("Missing or invalid batchId");
    await processShowCallsStatus(batchId);
    return true;
  }

  return createScaffoldMiddlewareV2({
    eth_accounts: (p: Params) => getAccounts(p.request),
    eth_requestAccounts: (p: Params) => getAccounts(p.request),
    eth_private_key: async (p: Params) => {
      if (!getPrivateKey) throw rpcErrors.methodNotSupported();
      return getPrivateKey(p.request);
    },
    eth_public_key: async (p: Params) => {
      if (!getPublicKey) throw rpcErrors.methodNotSupported();
      return getPublicKey(p.request);
    },
    public_key: async (p: Params) => {
      if (!getPublicKey) throw rpcErrors.methodNotSupported();
      return getPublicKey(p.request);
    },
    private_key: async (p: Params) => {
      if (!getPrivateKey) throw rpcErrors.methodNotSupported();
      return getPrivateKey(p.request);
    },
    eth_sendTransaction: async (p: Params) => {
      if (!processTransaction) throw rpcErrors.methodNotSupported();
      const req = p.request;
      const txParams: TransactionParams = (req.params as TransactionParams[])?.[0] ?? ({ from: "" } as TransactionParams);
      txParams.from = await validateAndNormalizeKeyholder(txParams.from as string, req);
      return processTransaction(txParams, req);
    },
    eth_signTransaction: async (p: Params) => {
      if (!processSignTransaction) throw rpcErrors.methodNotSupported();
      const req = p.request;
      const txParams: TransactionParams = (req.params as TransactionParams[])?.[0] ?? ({ from: "" } as TransactionParams);
      txParams.from = await validateAndNormalizeKeyholder(txParams.from as string, req);
      return processSignTransaction(txParams, req);
    },
    eth_sign: async (p: Params) => {
      if (!processEthSignMessage) throw rpcErrors.methodNotSupported();
      const req = p.request;
      let msgParams: MessageParams<string> = req.params as MessageParams<string>;
      const extraParams: Record<string, unknown> = (req.params as Record<string, unknown>[])?.[2] ?? {};
      if (Array.isArray(req.params)) {
        if (req.params.length !== 2) throw new Error(`WalletMiddleware - incorrect params for eth_sign. expected [address, message]`);
        const [address, message] = req.params as [string, string];
        msgParams = { from: address, data: message };
      }
      return processEthSignMessage({ ...extraParams, ...msgParams }, req);
    },
    eth_signTypedData_v4: async (p: Params) => {
      if (!processTypedMessageV4) throw rpcErrors.methodNotSupported();
      const req = p.request;
      if (!req?.params) throw new Error("WalletMiddleware - missing params");
      let msgParams: TypedMessageParams = req.params as TypedMessageParams;
      if (Array.isArray(req.params)) {
        if (req.params.length !== 2) throw new Error(`WalletMiddleware - incorrect params for eth_signTypedData_v4. expected [address, typedData]`);
        const [address, message] = req.params as [string, string];
        msgParams = { from: address, data: message };
      }
      return processTypedMessageV4(msgParams, req);
    },
    personal_sign: async (p: Params) => {
      if (!processPersonalMessage) throw rpcErrors.methodNotSupported();
      const req = p.request;
      let msgParams: MessageParams<string> = req.params as MessageParams<string>;
      const extraParams: Record<string, unknown> = (req.params as Record<string, unknown>[])?.[2] ?? {};
      if (Array.isArray(req.params)) {
        if (req.params.length < 2) throw new Error(`WalletMiddleware - incorrect params for personal_sign. expected [message, address]`);
        const params = req.params as [string, string];
        if (typeof params[0] === "object") {
          const { challenge, address } = params[0] as { challenge: string; address: string };
          msgParams = { from: address, data: challenge };
        } else {
          msgParams = { from: params[1], data: params[0] };
        }
      }
      return processPersonalMessage({ ...extraParams, ...msgParams }, req);
    },
    wallet_getCapabilities: async (p: Params) => getWalletCapabilitiesMiddleware(p.request),
    wallet_sendCalls: async (p: Params) => walletSendCallsMiddleware(p.request),
    wallet_batchCallStatus: async (p: Params) => walletBatchCallStatusMiddleware(p.request),
    wallet_showCallsStatus: async (p: Params) => walletShowCallsStatusMiddleware(p.request),
  });
}
