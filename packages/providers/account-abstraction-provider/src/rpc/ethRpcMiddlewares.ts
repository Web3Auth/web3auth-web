import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, JRPCResponse, rpcErrors } from "@web3auth/auth";
import { IProvider } from "@web3auth/base";
import { IProviderHandlers, TransactionParams } from "@web3auth/ethereum-provider";

import { MessageParams, TypedMessageParams } from "./types";

export async function createAaMiddleware({
  eoaProvider,
  handlers,
}: {
  eoaProvider: IProvider;
  handlers: Pick<IProviderHandlers, "getAccounts" | "getPrivateKey" | "processTransaction">;
}): Promise<JRPCMiddleware<unknown, unknown>> {
  const [eoaAddress] = (await eoaProvider.request({ method: "eth_accounts" })) as string[];

  /**
   * Validates the keyholder address, and returns a normalized (i.e. lowercase)
   * copy of it.
   *
   * an error
   */
  async function validateAndNormalizeKeyholder(address: string, req: JRPCRequest<unknown>): Promise<string> {
    if (typeof address === "string" && address.length > 0) {
      // ensure address is included in provided accounts
      const accounts: string[] = await handlers.getAccounts(req);
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

  async function normalizeSignSenderAddress(address: string, req: JRPCRequest<unknown>): Promise<string> {
    // sender is EOA address
    if (address.toLowerCase() === eoaAddress.toLowerCase()) {
      return eoaAddress;
    }

    const [smartAccountAddress] = await handlers.getAccounts(req);
    // sender is smart account address
    if (address.toLowerCase() === smartAccountAddress.toLowerCase()) {
      // use EOA address as sender for signing
      return eoaAddress;
    }

    throw rpcErrors.invalidParams({
      message: `Invalid parameters: must provide valid sender address.`,
    });
  }

  async function lookupAccounts(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await handlers.getAccounts(req);
  }

  async function lookupDefaultAccount(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    const accounts = await handlers.getAccounts(req);
    res.result = accounts[0] || null;
  }

  async function fetchPrivateKey(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!handlers.getPrivateKey) {
      throw rpcErrors.methodNotSupported();
    }
    res.result = handlers.getPrivateKey(req);
  }

  async function sendTransaction(req: JRPCRequest<TransactionParams>, res: JRPCResponse<unknown>): Promise<void> {
    if (!handlers.processTransaction) {
      throw rpcErrors.methodNotSupported();
    }
    const txParams: TransactionParams =
      (req.params as TransactionParams[])[0] ||
      ({
        from: "",
      } as TransactionParams);
    txParams.from = await validateAndNormalizeKeyholder(txParams.from as string, req);
    res.result = handlers.processTransaction(txParams, req);
  }

  async function signTransaction(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    const txParams: TransactionParams =
      (req.params as TransactionParams[])[0] ||
      ({
        from: "",
      } as TransactionParams);

    // normalize sender address
    if (txParams.from) {
      txParams.from = await normalizeSignSenderAddress(txParams.from, req);
    }

    res.result = await eoaProvider.request({
      method: "eth_signTransaction",
      params: req.params,
    });
  }

  async function ethSign(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    // normalize sender address
    if (Array.isArray(req.params)) {
      if (!(req.params.length === 2)) throw new Error(`WalletMiddleware - incorrect params for ${req.method} method. expected [address, message]`);

      const params = req.params as [string, string];
      const addressIndex = 0;
      const address = params[addressIndex];

      const normalizedAddress = await normalizeSignSenderAddress(address, req);
      params[addressIndex] = normalizedAddress;
    } else {
      const msgParams: MessageParams<string> = req.params as MessageParams<string>;
      const address = msgParams.from;

      const normalizedAddress = await normalizeSignSenderAddress(address, req);
      msgParams.from = normalizedAddress;
    }

    res.result = await eoaProvider.request({
      method: "eth_sign",
      params: req.params,
    });
  }

  async function signTypedDataV4(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    // normalize sender address
    if (Array.isArray(req.params)) {
      if (!(req.params.length === 2)) throw new Error(`WalletMiddleware - incorrect params for ${req.method} method. expected [address, typedData]`);

      const params = req.params as [string, string];
      const addressIndex = 0;
      const address = params[addressIndex];

      const normalizedAddress = await normalizeSignSenderAddress(address, req);
      params[addressIndex] = normalizedAddress;
    } else {
      const msgParams: TypedMessageParams = req.params as TypedMessageParams;
      const address = msgParams.from;

      const normalizedAddress = await normalizeSignSenderAddress(address, req);
      msgParams.from = normalizedAddress;
    }

    res.result = await eoaProvider.request({
      method: "eth_signTypedData_v4",
      params: req.params,
    });
  }

  async function personalSign(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    // normalize sender address
    if (Array.isArray(req.params)) {
      if (!(req.params.length >= 2)) throw new Error(`WalletMiddleware - incorrect params for ${req.method} method. expected [message, address]`);

      const params = req.params as [string, string];
      const addressIndex = 1;
      const address = params[addressIndex];

      const normalizedAddress = await normalizeSignSenderAddress(address, req);
      params[addressIndex] = normalizedAddress;
    } else {
      const msgParams: MessageParams<string> = req.params as MessageParams<string>;
      const address = msgParams.from;

      const normalizedAddress = await normalizeSignSenderAddress(address, req);
      msgParams.from = normalizedAddress;
    }

    res.result = await eoaProvider.request({
      method: "personal_sign",
      params: req.params,
    });
  }

  async function requestAccounts(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await eoaProvider.request({
      method: "eth_requestAccounts",
      params: req.params,
    });
  }

  async function updateAccount(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await eoaProvider.request({
      method: "wallet_updateAccount",
      params: req.params,
    });
  }

  return createScaffoldMiddleware({
    // account lookups
    eth_accounts: createAsyncMiddleware(lookupAccounts),
    eth_private_key: createAsyncMiddleware(fetchPrivateKey),
    private_key: createAsyncMiddleware(fetchPrivateKey),
    eth_coinbase: createAsyncMiddleware(lookupDefaultAccount),
    eth_requestAccounts: createAsyncMiddleware(requestAccounts),
    wallet_updateAccount: createAsyncMiddleware(updateAccount),
    // tx signatures
    eth_sendTransaction: createAsyncMiddleware(sendTransaction),
    eth_signTransaction: createAsyncMiddleware(signTransaction),
    // message signatures
    eth_sign: createAsyncMiddleware(ethSign),
    eth_signTypedData_v4: createAsyncMiddleware(signTypedDataV4),
    personal_sign: createAsyncMiddleware(personalSign),
  });
}
