import { createScaffoldMiddlewareV2, type JRPCRequest, rpcErrors } from "@web3auth/auth";

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
  } as Parameters<typeof createScaffoldMiddlewareV2>[0]);
}
