import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, JRPCResponse, rpcErrors } from "@web3auth/auth";

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

  async function lookupDefaultAccount(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    const accounts = await getAccounts(req);
    res.result = accounts[0] || null;
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
    res.result = getPrivateKey(req);
  }

  async function fetchPublicKey(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!getPublicKey) {
      throw rpcErrors.methodNotSupported();
    }
    res.result = getPublicKey(req);
  }

  return createScaffoldMiddleware({
    // account lookups
    eth_accounts: createAsyncMiddleware(lookupAccounts),
    eth_private_key: createAsyncMiddleware(fetchPrivateKey),
    eth_public_key: createAsyncMiddleware(fetchPublicKey),
    public_key: createAsyncMiddleware(fetchPublicKey),
    private_key: createAsyncMiddleware(fetchPrivateKey),
    eth_coinbase: createAsyncMiddleware(lookupDefaultAccount),
    // tx signatures
    eth_sendTransaction: createAsyncMiddleware(sendTransaction),
    eth_signTransaction: createAsyncMiddleware(signTransaction),
    // message signatures
    eth_sign: createAsyncMiddleware(ethSign),
    eth_signTypedData_v4: createAsyncMiddleware(signTypedDataV4),
    personal_sign: createAsyncMiddleware(personalSign),
  });
}
