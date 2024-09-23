import { isHexString } from "@ethereumjs/util";
import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, JRPCResponse, rpcErrors } from "@web3auth/auth";
import { IProvider } from "@web3auth/base";
import { IProviderHandlers, TransactionParams } from "@web3auth/ethereum-provider";
import { TypedDataEncoder } from "ethers";
import { Chain, createWalletClient, Hex, http } from "viem";
import { SmartAccount } from "viem/account-abstraction";

import { MessageParams, SignTypedDataMessageV4, TypedMessageParams } from "./types";

export async function createAaMiddleware({
  eoaProvider,
  smartAccount,
  chain,
  handlers,
}: {
  eoaProvider: IProvider;
  smartAccount: SmartAccount;
  chain: Chain;
  handlers: Pick<IProviderHandlers, "getAccounts" | "getPrivateKey" | "processTransaction">;
}): Promise<JRPCMiddleware<unknown, unknown>> {
  const [eoaAddress] = (await eoaProvider.request({ method: "eth_accounts" })) as string[];

  const walletClient = createWalletClient({
    account: smartAccount,
    chain,
    transport: http(),
  });

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

    const request = await walletClient.prepareTransactionRequest({
      account: smartAccount,
      to: txParams.to,
      value: txParams.value,
      kzg: undefined,
      chain: undefined,
    });
    // TODO: correct transaction request type
    res.result = await walletClient.signTransaction(request as unknown as Parameters<typeof walletClient.signTransaction>[0]);
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

    res.result = await walletClient.signMessage({
      account: smartAccount,
      message: {
        raw: msgParams.data as Hex,
      },
    });
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

    const data: SignTypedDataMessageV4 = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;

    // Deduce the primary type using ethers
    const typedData = TypedDataEncoder.from(data.types);
    const { primaryType } = typedData;

    res.result = await walletClient.signTypedData({
      account: smartAccount,
      domain: {
        ...data.domain,
        verifyingContract: data.domain.verifyingContract as Hex,
        salt: data.domain.salt as Hex,
        chainId: Number(data.domain.chainId),
      },
      primaryType,
      types: data.types,
      message: data.message,
    });
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

    const message = msgParams.data;
    const signed = await walletClient.signMessage({
      account: smartAccount,
      message: isHexString(message)
        ? {
            raw: message,
          }
        : message,
    });
    res.result = signed;
  }

  return createScaffoldMiddleware({
    // account lookups
    eth_accounts: createAsyncMiddleware(lookupAccounts),
    eth_private_key: createAsyncMiddleware(fetchPrivateKey),
    private_key: createAsyncMiddleware(fetchPrivateKey),
    // tx signatures
    eth_sendTransaction: createAsyncMiddleware(sendTransaction),
    eth_signTransaction: createAsyncMiddleware(signTransaction),
    // message signatures
    eth_sign: createAsyncMiddleware(ethSign),
    eth_signTypedData_v4: createAsyncMiddleware(signTypedDataV4),
    personal_sign: createAsyncMiddleware(personalSign),
  });
}
