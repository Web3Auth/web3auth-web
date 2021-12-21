import { createScaffoldMiddleware, JRPCMiddleware, mergeMiddleware } from "@toruslabs/openlogin-jrpc";

import { createWalletMiddleware, WalletMiddlewareOptions } from "./walletMidddleware";

export type IProviderHandlers = WalletMiddlewareOptions;

export function createEthMiddleware(providerHandlers: IProviderHandlers): JRPCMiddleware<unknown, unknown> {
  const {
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
