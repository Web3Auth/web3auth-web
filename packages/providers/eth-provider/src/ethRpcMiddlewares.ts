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
