import { Eip5792GetCapabilitiesParams, Eip5792SendCallsParams } from "@toruslabs/ethereum-controllers";
import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, JRPCResponse, rpcErrors } from "@web3auth/auth";
import { isHex, toHex } from "viem";

import type { MessageParams, TransactionParams, TypedMessageParams, WalletMiddlewareOptions } from "./interfaces";

export function createWalletMiddleware({
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
}: WalletMiddlewareOptions): JRPCMiddleware<string, unknown> {
  if (!getAccounts) {
    throw new Error("opts.getAccounts is required");
  }

  //
  // utility
  //

  /**
   * Validates the keyholder address, and returns a normalized (i.e. lowercase)
   * copy of it.
   *
   * an error
   */
  async function validateAndNormalizeKeyholder(address: string, req: JRPCRequest<unknown>): Promise<string> {
    if (typeof address === "string" && address.length > 0) {
      // ensure address is included in provided accounts
      const accounts: string[] = await getAccounts(req);
      const normalizedAccounts: string[] = accounts.map((_address) => _address.toLowerCase());
      const normalizedAddress: string = address.toLowerCase();

      if (normalizedAccounts.includes(normalizedAddress)) {
        return normalizedAddress;
      }
    }
    throw rpcErrors.invalidParams({
      message: `Invalid parameters: must provide an Ethereum address.`,
    });
  }

  //
  // account lookups
  //

  async function lookupAccounts(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await getAccounts(req);
  }

  //
  // transaction signatures
  //

  async function sendTransaction(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processTransaction) {
      throw rpcErrors.methodNotSupported();
    }

    const txParams: TransactionParams =
      (req.params as TransactionParams[])[0] ||
      ({
        from: "",
      } as TransactionParams);
    txParams.from = await validateAndNormalizeKeyholder(txParams.from as string, req);
    res.result = await processTransaction(txParams, req);
  }

  async function signTransaction(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processSignTransaction) {
      throw rpcErrors.methodNotSupported();
    }

    const txParams: TransactionParams =
      (req.params as TransactionParams[])[0] ||
      ({
        from: "",
      } as TransactionParams);
    txParams.from = await validateAndNormalizeKeyholder(txParams.from as string, req);
    res.result = await processSignTransaction(txParams, req);
  }

  //
  // message signatures
  //

  async function ethSign(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processEthSignMessage) {
      throw rpcErrors.methodNotSupported();
    }
    let msgParams: MessageParams<string> = req.params as MessageParams<string>;
    const extraParams: Record<string, unknown> = (req.params as Record<string, unknown>[])[2] || {};

    if (Array.isArray(req.params)) {
      if (!(req.params.length === 2)) throw new Error(`WalletMiddleware - incorrect params for ${req.method} method. expected [address, message]`);

      const params = req.params as [string, string];
      const address = params[0];
      const message = params[1];

      msgParams = {
        from: address,
        data: message,
      };
    }
    msgParams = { ...extraParams, ...msgParams };

    res.result = await processEthSignMessage(msgParams, req);
  }

  async function signTypedDataV4(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processTypedMessageV4) {
      throw rpcErrors.methodNotSupported();
    }
    if (!req?.params) throw new Error("WalletMiddleware - missing params");

    let msgParams: TypedMessageParams = req.params as TypedMessageParams;

    if (Array.isArray(req.params)) {
      if (!(req.params.length === 2)) throw new Error(`WalletMiddleware - incorrect params for ${req.method} method. expected [address, typedData]`);

      const params = req.params as [string, string];
      const address = params[0];
      const message = params[1];

      msgParams = {
        from: address,
        data: message,
      };
    }
    res.result = await processTypedMessageV4(msgParams, req);
  }

  async function personalSign(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processPersonalMessage) {
      throw rpcErrors.methodNotSupported();
    }

    let msgParams: MessageParams<string> = req.params as MessageParams<string>;
    const extraParams: Record<string, unknown> = (req.params as Record<string, unknown>[])[2] || {};

    if (Array.isArray(req.params)) {
      if (!(req.params.length >= 2)) throw new Error(`WalletMiddleware - incorrect params for ${req.method} method. expected [message, address]`);

      const params = req.params as [string, string];
      if (typeof params[0] === "object") {
        const { challenge, address } = params[0] as { challenge: string; address: string };
        msgParams = {
          from: address,
          data: challenge,
        };
      } else {
        const message = params[0];
        const address = params[1];

        msgParams = {
          from: address,
          data: message,
        };
      }
    }
    msgParams = { ...extraParams, ...msgParams };

    res.result = await processPersonalMessage(msgParams, req);
  }

  async function fetchPrivateKey(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!getPrivateKey) {
      throw rpcErrors.methodNotSupported();
    }
    res.result = await getPrivateKey(req);
  }

  async function fetchPublicKey(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!getPublicKey) {
      throw rpcErrors.methodNotSupported();
    }
    res.result = await getPublicKey(req);
  }

  async function getWalletCapabilitiesMiddleware(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processGetCapabilities) {
      throw rpcErrors.methodNotSupported();
    }

    if (!Array.isArray(req.params) || req.params.length === 0) {
      throw rpcErrors.invalidParams("Invalid parameters");
    }

    const account = req.params[0] as string;
    if (!isHex(account)) {
      throw rpcErrors.invalidParams("Invalid account address");
    }

    let chainIds = req.params[1] || []; // if empty array is provided, the wallet will return capabilities for all supported chains
    if (!Array.isArray(chainIds)) {
      throw rpcErrors.invalidParams(`Invalid params, received: ${chainIds}. expected: Array`);
    }

    // format chain ids
    chainIds = chainIds.map((chainId) => (isHex(chainId) ? chainId : toHex(chainId)));

    const getCapabilitiesParams: Eip5792GetCapabilitiesParams = [
      account, // account address
      chainIds, // [`0xstring`, `0xstring`, ...]
    ];

    res.result = await processGetCapabilities(getCapabilitiesParams);
  }

  async function walletSendCallsMiddleware(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processSendCalls) {
      throw rpcErrors.methodNotSupported();
    }

    const params = Array.isArray(req.params) ? req.params[0] : req.params;

    const walletSendCallsParams: Eip5792SendCallsParams = {
      ...params,
      chainId: isHex(params.chainId) ? params.chainId : toHex(params.chainId),
    };

    res.result = await processSendCalls(walletSendCallsParams);
  }

  async function walletBatchCallStatusMiddleware(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!processGetCallsStatus) {
      throw rpcErrors.methodNotSupported();
    }

    const batchId = Array.isArray(req.params) ? req.params[0] : (req.params as string);

    res.result = await processGetCallsStatus(batchId);
  }

  return createScaffoldMiddleware({
    // account lookups
    eth_accounts: createAsyncMiddleware(lookupAccounts),
    eth_requestAccounts: createAsyncMiddleware(lookupAccounts),
    eth_private_key: createAsyncMiddleware(fetchPrivateKey),
    eth_public_key: createAsyncMiddleware(fetchPublicKey),
    public_key: createAsyncMiddleware(fetchPublicKey),
    private_key: createAsyncMiddleware(fetchPrivateKey),
    // tx signatures
    eth_sendTransaction: createAsyncMiddleware(sendTransaction),
    eth_signTransaction: createAsyncMiddleware(signTransaction),
    // message signatures
    eth_sign: createAsyncMiddleware(ethSign),
    eth_signTypedData_v4: createAsyncMiddleware(signTypedDataV4),
    personal_sign: createAsyncMiddleware(personalSign),
    // EIP-5792
    wallet_getCapabilities: createAsyncMiddleware(getWalletCapabilitiesMiddleware), // EIP-5792: Wallet Capabilities
    wallet_sendCalls: createAsyncMiddleware(walletSendCallsMiddleware), // EIP-5792: Send Batch Calls
    wallet_getCallsStatus: createAsyncMiddleware(walletBatchCallStatusMiddleware), // EIP-5792: Batch Call Status
  });
}
