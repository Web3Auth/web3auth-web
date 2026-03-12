import type { Eip5792GetCapabilitiesParams, Eip5792SendCallsParams } from "@toruslabs/ethereum-controllers";
import { createScaffoldMiddlewareV2, type JRPCRequest, type MiddlewareParams, rpcErrors } from "@web3auth/auth";
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

  // Account lookups
  function ethAccountsHandler(p: MiddlewareParams<JRPCRequest<unknown>>) {
    return getAccounts(p.request);
  }

  // Tx signatures
  async function ethSendTransactionHandler(p: MiddlewareParams<JRPCRequest<[TransactionParams]>>) {
    if (!processTransaction) throw rpcErrors.methodNotSupported();

    const req = p.request;
    const txParams = req.params?.[0] ?? { from: "" };
    txParams.from = await validateAndNormalizeKeyholder(txParams.from, req);

    return processTransaction(txParams, req);
  }

  async function ethSignTransactionHandler(p: MiddlewareParams<JRPCRequest<[TransactionParams]>>) {
    if (!processSignTransaction) throw rpcErrors.methodNotSupported();

    const req = p.request;
    const txParams = req.params?.[0] ?? { from: "" };
    txParams.from = await validateAndNormalizeKeyholder(txParams.from, req);

    return processSignTransaction(txParams, req);
  }

  // Message signatures
  async function ethSignHandler(p: MiddlewareParams<JRPCRequest<MessageParams<string> | [string, string]>>) {
    if (!processEthSignMessage) throw rpcErrors.methodNotSupported();

    const req = p.request;
    let msgParams: MessageParams<string>;
    if (Array.isArray(req.params)) {
      if (req.params.length !== 2) throw new Error(`WalletMiddleware - incorrect params for eth_sign. expected [address, message]`);

      const [address, message] = req.params;
      msgParams = { from: address, data: message };
    } else {
      msgParams = req.params ?? { from: "", data: "" };
    }

    return processEthSignMessage(msgParams, req);
  }

  async function ethSignTypedDataV4Handler(p: MiddlewareParams<JRPCRequest<TypedMessageParams | [string, string]>>) {
    if (!processTypedMessageV4) throw rpcErrors.methodNotSupported();

    const req = p.request;
    if (!req?.params) throw new Error("WalletMiddleware - missing params");

    let msgParams: TypedMessageParams;
    if (Array.isArray(req.params)) {
      if (req.params.length !== 2) throw new Error(`WalletMiddleware - incorrect params for eth_signTypedData_v4. expected [address, typedData]`);
      const [address, message] = req.params;
      msgParams = { from: address, data: message };
    } else {
      msgParams = req.params as TypedMessageParams;
    }

    return processTypedMessageV4(msgParams, req);
  }

  async function personalSignHandler(p: MiddlewareParams<JRPCRequest<MessageParams<string> | [string, string] | [Record<string, unknown>, string]>>) {
    if (!processPersonalMessage) throw rpcErrors.methodNotSupported();

    const req = p.request;
    let msgParams: MessageParams<string>;
    if (Array.isArray(req.params)) {
      if (req.params.length < 2) throw new Error(`WalletMiddleware - incorrect params for personal_sign. expected [message, address]`);

      const params = req.params;
      if (typeof params[0] === "object" && params[0] !== null && "challenge" in params[0] && "address" in params[0]) {
        const { challenge, address } = params[0] as { challenge: string; address: string };
        msgParams = { from: address, data: challenge };
      } else {
        msgParams = { from: params[1], data: typeof params[0] === "string" ? params[0] : "" };
      }
    } else {
      msgParams = req.params ?? { from: "", data: "" };
    }

    return processPersonalMessage(msgParams, req);
  }

  async function ethPrivateKeyHandler(p: MiddlewareParams<JRPCRequest<unknown>>) {
    if (!getPrivateKey) throw rpcErrors.methodNotSupported();

    return getPrivateKey(p.request);
  }

  async function ethPublicKeyHandler(p: MiddlewareParams<JRPCRequest<unknown>>) {
    if (!getPublicKey) throw rpcErrors.methodNotSupported();

    return getPublicKey(p.request);
  }

  async function walletGetCapabilitiesHandler(p: MiddlewareParams<JRPCRequest<Eip5792GetCapabilitiesParams>>) {
    if (!processGetCapabilities) throw rpcErrors.methodNotSupported();

    const req = p.request;
    if (!req.params || !Array.isArray(req.params) || req.params.length < 2) throw rpcErrors.invalidParams("Invalid parameters");
    const account = req.params[0];
    if (!isHex(account)) throw rpcErrors.invalidParams("Invalid account address");

    let chainIds = req.params[1] ?? [];
    if (!Array.isArray(chainIds)) throw rpcErrors.invalidParams(`Invalid params, received: ${chainIds}. expected: Array`);
    chainIds = chainIds.map((chainId: string) => (isHex(chainId) ? chainId : toHex(chainId)));

    const getCapabilitiesParams: Eip5792GetCapabilitiesParams = [account, chainIds];
    return processGetCapabilities(getCapabilitiesParams);
  }

  async function walletSendCallsHandler(p: MiddlewareParams<JRPCRequest<Eip5792SendCallsParams | [Eip5792SendCallsParams]>>) {
    if (!processSendCalls) throw rpcErrors.methodNotSupported();

    const req = p.request;
    const params = Array.isArray(req.params) ? req.params[0] : req.params;
    if (!params || typeof params !== "object") throw rpcErrors.invalidParams("Missing or invalid params for wallet_sendCalls");
    if (!params.version || typeof params.version !== "string")
      throw rpcErrors.invalidParams(`Invalid version: expected string, got "${params.version || "undefined"}"`);
    if (!params.chainId) throw rpcErrors.invalidParams("Missing required field: chainId");
    if (!Array.isArray(params.calls) || params.calls.length === 0) throw rpcErrors.invalidParams("calls must be a non-empty array");
    const from = params.from;
    if (from) await validateAndNormalizeKeyholder(from, req);

    const walletSendCallsParams: Eip5792SendCallsParams = {
      ...params,
      chainId: isHex(params.chainId) ? params.chainId : toHex(params.chainId),
    };
    return processSendCalls(walletSendCallsParams);
  }

  async function walletBatchCallStatusHandler(p: MiddlewareParams<JRPCRequest<string | [string]>>) {
    if (!processGetCallsStatus) throw rpcErrors.methodNotSupported();

    const req = p.request;
    const batchId = Array.isArray(req.params) ? req.params[0] : req.params;
    if (!batchId || typeof batchId !== "string") throw rpcErrors.invalidParams("Missing or invalid batchId");

    return processGetCallsStatus(batchId);
  }

  async function walletShowCallsStatusHandler(p: MiddlewareParams<JRPCRequest<string | [string]>>) {
    if (!processShowCallsStatus) throw rpcErrors.methodNotSupported();

    const req = p.request;
    const batchId = Array.isArray(req.params) ? req.params[0] : req.params;
    if (!batchId || typeof batchId !== "string") throw rpcErrors.invalidParams("Missing or invalid batchId");

    await processShowCallsStatus(batchId);
    return true;
  }

  return createScaffoldMiddlewareV2({
    // account lookups
    eth_accounts: ethAccountsHandler,
    eth_requestAccounts: ethAccountsHandler,
    eth_private_key: ethPrivateKeyHandler,
    eth_public_key: ethPublicKeyHandler,
    public_key: ethPublicKeyHandler,
    private_key: ethPrivateKeyHandler,
    // tx signatures
    eth_sendTransaction: ethSendTransactionHandler,
    eth_signTransaction: ethSignTransactionHandler,
    // message signatures
    eth_sign: ethSignHandler,
    eth_signTypedData_v4: ethSignTypedDataV4Handler,
    personal_sign: personalSignHandler,
    // EIP5792
    wallet_getCapabilities: walletGetCapabilitiesHandler,
    wallet_sendCalls: walletSendCallsHandler,
    wallet_batchCallStatus: walletBatchCallStatusHandler,
    wallet_showCallsStatus: walletShowCallsStatusHandler,
  });
}
