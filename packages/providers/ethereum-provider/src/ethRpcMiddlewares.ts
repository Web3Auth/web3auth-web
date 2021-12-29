import { createScaffoldMiddleware, JRPCMiddleware, mergeMiddleware } from "@toruslabs/openlogin-jrpc";

import { createWalletMiddleware, WalletMiddlewareOptions } from "./walletMidddleware";

export interface IProviderHandlers extends WalletMiddlewareOptions {
  version: string;
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
  const ethMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      eth_syncing: false,
      web3_clientVersion: `Web3Auth/v${version}`,
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
  return ethMiddleware;
}
