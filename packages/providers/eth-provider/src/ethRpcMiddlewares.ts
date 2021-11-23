import { createAsyncMiddleware, createScaffoldMiddleware, JRPCMiddleware, JRPCRequest, mergeMiddleware } from "@toruslabs/openlogin-jrpc";
import type { TransactionConfig } from "web3-core";

import { createWalletMiddleware, WalletMiddlewareOptions } from "./walletMidddleware";
interface EthSignMessageParams {
  address: string;
  message: string;
}
interface PersonalSignMessageParams {
  address: string;
  message: string;
}

export interface IProviderHandlers extends WalletMiddlewareOptions {
  version: string;
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

export function createProcessTransactionMiddleware({
  processTransaction,
}: {
  processTransaction: (tx: TransactionConfig) => Promise<string>;
}): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware<unknown, unknown>(async (request: JRPCRequest<unknown[]>, response, next) => {
    const { method } = request;
    if (method !== "eth_sendTransaction") return next();

    if (!processTransaction) throw new Error(`WalletMiddleware - processTransaction not provided`);

    const result = await processTransaction(request.params[0]);

    response.result = result;
  });
}

export function createEthSignMiddleware({
  processEthSignMessage,
}: {
  processEthSignMessage: (msgParams: EthSignMessageParams) => Promise<string>;
}): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware<unknown, unknown>(async (request: JRPCRequest<unknown[]>, response, next) => {
    const { method } = request;
    if (method !== "eth_sign") return next();

    if (!processEthSignMessage) throw new Error(`WalletMiddleware - processEthSignMessage not provided`);

    if (request.params.length !== 2) throw new Error(`WalletMiddleware - eth_sign requires address and message params`);
    const result = await processEthSignMessage({
      address: request.params[0],
      message: request.params[1],
    } as EthSignMessageParams);

    response.result = result;
  });
}

export function createPersonalSignMiddleware({
  processPersonalMessage,
}: {
  processPersonalMessage: (msgParams: PersonalSignMessageParams) => Promise<string>;
}): JRPCMiddleware<unknown, unknown> {
  return createAsyncMiddleware<unknown, unknown>(async (request: JRPCRequest<unknown[]>, response, next) => {
    const { method } = request;
    if (method !== "eth_personal_sign") return next();

    if (!processPersonalMessage) throw new Error(`WalletMiddleware - processPersonalMessage not provided`);
    if (request.params.length !== 2) throw new Error(`WalletMiddleware - eth_personal_sign requires address and message params`);

    const result = await processPersonalMessage({
      address: request.params[0],
      message: request.params[1],
    } as PersonalSignMessageParams);
    response.result = result;
  });
}
export function createEthMiddleware(providerHandlers: IProviderHandlers): JRPCMiddleware<unknown, unknown> {
  const {
    version,
    getAccounts,
    processTransaction,
    processEthSignMessage,
    processTypedMessage,
    processTypedMessageV3,
    processTypedMessageV4,
    processPersonalMessage,
    processEncryptionPublicKey,
    processDecryptMessage,
  } = providerHandlers;
  const metamaskMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      eth_syncing: false,
      web3_clientVersion: `Torus/v${version}`,
    }),
    createWalletMiddleware({
      getAccounts,
      processTransaction,
      processEthSignMessage,
      processTypedMessage,
      processTypedMessageV3,
      processTypedMessageV4,
      processPersonalMessage,
      processEncryptionPublicKey,
      processDecryptMessage,
    }),
  ]);
  return metamaskMiddleware;
}
