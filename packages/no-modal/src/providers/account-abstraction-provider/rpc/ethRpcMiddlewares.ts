import { METHOD_TYPES } from "@toruslabs/ethereum-controllers";
import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, JRPCResponse, rpcErrors } from "@web3auth/auth";

import { IProvider } from "../../../base";
import { IEthProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../ethereum-provider";

export async function createAaMiddleware({
  eoaProvider,
  handlers,
}: {
  eoaProvider: IProvider;
  handlers: IEthProviderHandlers;
}): Promise<JRPCMiddleware<unknown, unknown>> {
  const [eoaAddress] = (await eoaProvider.request({ method: METHOD_TYPES.GET_ACCOUNTS })) as string[];

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

  async function fetchPrivateKey(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!handlers.getPrivateKey) {
      throw rpcErrors.methodNotSupported();
    }
    res.result = await handlers.getPrivateKey(req);
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

    res.result = await handlers.processSignTransaction(txParams, req);
  }

  async function ethSign(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
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

    res.result = await handlers.processEthSignMessage(msgParams, req);
  }

  async function signTypedDataV4(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
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

    res.result = await handlers.processTypedMessageV4(msgParams, req);
  }

  async function personalSign(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
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

    res.result = await handlers.processPersonalMessage(msgParams, req);
  }

  async function fetchPublicKey(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    if (!handlers.getPublicKey) {
      throw rpcErrors.methodNotSupported();
    }
    res.result = await handlers.getPublicKey(req);
  }

  return createScaffoldMiddleware({
    // account lookups
    eth_accounts: createAsyncMiddleware(lookupAccounts),
    eth_requestAccounts: createAsyncMiddleware(lookupAccounts),
    eth_private_key: createAsyncMiddleware(fetchPrivateKey),
    private_key: createAsyncMiddleware(fetchPrivateKey),
    eth_public_key: createAsyncMiddleware(fetchPublicKey),
    public_key: createAsyncMiddleware(fetchPublicKey),
    // tx signatures
    eth_sendTransaction: createAsyncMiddleware(sendTransaction),
    eth_signTransaction: createAsyncMiddleware(signTransaction),
    // message signatures
    eth_sign: createAsyncMiddleware(ethSign),
    eth_signTypedData_v4: createAsyncMiddleware(signTypedDataV4),
    personal_sign: createAsyncMiddleware(personalSign),
  });
}

export async function createEoaMiddleware({ aaProvider }: { aaProvider: IProvider }): Promise<JRPCMiddleware<unknown, unknown>> {
  async function getAccounts(_req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    const [, eoaAddress] = await aaProvider.request<never, string[]>({ method: METHOD_TYPES.GET_ACCOUNTS });
    res.result = [eoaAddress];
  }

  async function requestAccounts(_req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    const [, eoaAddress] = await aaProvider.request<never, string[]>({ method: METHOD_TYPES.ETH_REQUEST_ACCOUNTS });
    res.result = [eoaAddress];
  }

  return createScaffoldMiddleware({
    eth_accounts: createAsyncMiddleware(getAccounts),
    eth_requestAccounts: createAsyncMiddleware(requestAccounts),
  });
}

export function providerAsMiddleware(provider: IProvider): JRPCMiddleware<unknown, unknown> {
  return async (req, res, _next, end) => {
    // send request to provider
    try {
      const providerRes = await provider.request(req);
      res.result = providerRes;
      return end();
    } catch (error) {
      return end(error as Error);
    }
  };
}
