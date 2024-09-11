import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, JRPCResponse, rpcErrors } from "@web3auth/auth";
import { IProvider } from "@web3auth/base";
import { IProviderHandlers, TransactionParams } from "@web3auth/ethereum-provider";

export async function createAaMiddleware({
  eoaProvider,
  handlers,
}: {
  eoaProvider: IProvider;
  handlers: Pick<IProviderHandlers, "getAccounts" | "getPrivateKey" | "processTransaction">;
}): Promise<JRPCMiddleware<unknown, unknown>> {
  // const [eoaAddress] = (await eoaProvider.request({ method: "eth_accounts" })) as string[];

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
    res.result = await eoaProvider.request({
      method: "eth_signTransaction",
      params: req.params,
    });
  }

  async function ethSign(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await eoaProvider.request({
      method: "eth_sign",
      params: req.params,
    });
  }

  async function signTypedDataV4(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await eoaProvider.request({
      method: "eth_signTypedData_v4",
      params: req.params,
    });
  }

  async function personalSign(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    res.result = await eoaProvider.request({
      method: "personal_sign",
      params: req.params,
    });
  }

  return createScaffoldMiddleware({
    // account lookups
    eth_accounts: createAsyncMiddleware(lookupAccounts),
    eth_private_key: createAsyncMiddleware(fetchPrivateKey),
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
