import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, mergeMiddleware } from "@toruslabs/openlogin-jrpc";
import type { TransactionConfig } from "web3-core";

interface EthSignMessageParams {
  address: string;
  message: string;
}
interface PersonalSignMessageParams {
  address: string;
  message: string;
}

export interface IProviderHandlers {
  version: string;
  getAccounts: () => Promise<string[]>;
  processTransaction?: (txParams: TransactionConfig) => Promise<string>;
  processEthSignMessage?: (msgParams: EthSignMessageParams) => Promise<string>;
  processPersonalMessage?: (msgParams: PersonalSignMessageParams) => Promise<string>;
  // processTypedMessage?: (msgParams: TypedDataV1, req: JRPCRequest<unknown>, version: string) => Promise<string>;
  // processTypedMessageV3?: (msgParams: TypedMessageParams, req: JRPCRequest<unknown>, version: string) => Promise<Record<string, unknown>>;
  // processTypedMessageV4?: (msgParams: TypedMessageParams, req: JRPCRequest<unknown>, version: string) => Promise<Record<string, unknown>>;
}

export function createRequestAccountsMiddleware({ getAccounts }) {
  return createAsyncMiddleware(async (request, response, next) => {
    const { method } = request;
    if (method !== "eth_requestAccounts") return next();

    if (!getAccounts) throw new Error("WalletMiddleware - opts.getAccounts not provided");
    const accounts = await getAccounts();
    response.result = accounts;
  });
}

export function createProcessTransactionMiddleware(processTransaction: (tx: TransactionConfig) => Promise<string>): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware<unknown, unknown>(async (request: JRPCRequest<unknown[]>, response, next) => {
    const { method } = request;
    if (method !== "eth_sendTransaction") return next();

    if (!processTransaction) throw new Error(`WalletMiddleware - processTransaction not provided`);

    const result = await processTransaction(request.params[0]);

    response.result = result;
  });
}
export function createEthMiddleware(providerHandlers: IProviderHandlers): JRPCMiddleware<unknown, unknown> {
  const {
    version,
    getAccounts,
    processTransaction,
    // processEthSignMessage,
    // processTypedMessage,
    // processTypedMessageV3,
    // processTypedMessageV4,
    // processPersonalMessage,
    // processEncryptionPublicKey,
    // processDecryptMessage,
  } = providerHandlers;
  const metamaskMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      // staticSubprovider
      eth_syncing: false,
      web3_clientVersion: `Torus/v${version}`,
    }),
    createProcessTransactionMiddleware(processTransaction),
    // createWalletMiddleware({
    //   getAccounts,
    //   processTransaction,
    //   processEthSignMessage,
    //   processTypedMessage,
    //   processTypedMessageV3,
    //   processTypedMessageV4,
    //   processPersonalMessage,
    //   processEncryptionPublicKey,
    //   processDecryptMessage,
    // }),
    createRequestAccountsMiddleware({ getAccounts }),
  ]);
  return metamaskMiddleware;
}
