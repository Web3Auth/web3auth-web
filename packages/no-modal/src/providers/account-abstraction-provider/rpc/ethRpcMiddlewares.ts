import { METHOD_TYPES } from "@toruslabs/ethereum-controllers";
import { createScaffoldMiddlewareV2, type JRPCRequest, type MiddlewareConstraint, type MiddlewareParams, rpcErrors } from "@web3auth/auth";

import { IProvider } from "../../../base";
import { IEthProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../ethereum-provider";

export async function createAaMiddleware({
  eoaProvider,
  handlers,
}: {
  eoaProvider: IProvider;
  handlers: IEthProviderHandlers;
}): Promise<MiddlewareConstraint> {
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

  async function lookupAccounts(params: MiddlewareParams<JRPCRequest<unknown>>): Promise<string[]> {
    return handlers.getAccounts(params.request);
  }

  async function fetchPrivateKey(params: MiddlewareParams<JRPCRequest<unknown>>): Promise<string> {
    if (!handlers.getPrivateKey) {
      throw rpcErrors.methodNotSupported();
    }
    return handlers.getPrivateKey(params.request);
  }

  async function sendTransaction(params: MiddlewareParams<JRPCRequest<TransactionParams[]>>): Promise<string> {
    if (!handlers.processTransaction) {
      throw rpcErrors.methodNotSupported();
    }
    const req = params.request;
    const txParams: TransactionParams =
      (req.params as TransactionParams[])[0] ||
      ({
        from: "",
      } as TransactionParams);
    txParams.from = await validateAndNormalizeKeyholder(txParams.from as string, req);
    return handlers.processTransaction(txParams, req);
  }

  async function signTransaction(params: MiddlewareParams<JRPCRequest<TransactionParams[]>>): Promise<string> {
    const req = params.request;
    const txParams: TransactionParams =
      (req.params as TransactionParams[])[0] ||
      ({
        from: "",
      } as TransactionParams);

    // normalize sender address
    if (txParams.from) {
      txParams.from = await normalizeSignSenderAddress(txParams.from, req);
    }

    return handlers.processSignTransaction(txParams, req);
  }

  async function ethSign(params: MiddlewareParams<JRPCRequest<unknown>>): Promise<string> {
    const req = params.request;
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

    return handlers.processEthSignMessage(msgParams, req);
  }

  async function signTypedDataV4(params: MiddlewareParams<JRPCRequest<unknown>>): Promise<string> {
    const req = params.request;
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

    return handlers.processTypedMessageV4(msgParams, req);
  }

  async function personalSign(params: MiddlewareParams<JRPCRequest<unknown>>): Promise<string> {
    const req = params.request;
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

    return handlers.processPersonalMessage(msgParams, req);
  }

  async function fetchPublicKey(params: MiddlewareParams<JRPCRequest<unknown>>): Promise<string> {
    if (!handlers.getPublicKey) {
      throw rpcErrors.methodNotSupported();
    }
    return handlers.getPublicKey(params.request);
  }

  return createScaffoldMiddlewareV2({
    // account lookups
    eth_accounts: lookupAccounts,
    eth_requestAccounts: lookupAccounts,
    eth_private_key: fetchPrivateKey,
    private_key: fetchPrivateKey,
    eth_public_key: fetchPublicKey,
    public_key: fetchPublicKey,
    // tx signatures
    eth_sendTransaction: sendTransaction,
    eth_signTransaction: signTransaction,
    // message signatures
    eth_sign: ethSign,
    eth_signTypedData_v4: signTypedDataV4,
    personal_sign: personalSign,
  });
}

export async function createEoaMiddleware({ aaProvider }: { aaProvider: IProvider }): Promise<MiddlewareConstraint> {
  async function getAccounts(): Promise<string[]> {
    const [, eoaAddress] = await aaProvider.request<never, string[]>({ method: METHOD_TYPES.GET_ACCOUNTS });
    return [eoaAddress];
  }

  async function requestAccounts(): Promise<string[]> {
    const [, eoaAddress] = await aaProvider.request<never, string[]>({ method: METHOD_TYPES.ETH_REQUEST_ACCOUNTS });
    return [eoaAddress];
  }

  return createScaffoldMiddlewareV2({
    eth_accounts: getAccounts,
    eth_requestAccounts: requestAccounts,
  });
}

export function providerAsMiddleware(provider: IProvider): MiddlewareConstraint {
  return async ({ request }) => {
    return provider.request({ method: request.method, params: request.params });
  };
}
