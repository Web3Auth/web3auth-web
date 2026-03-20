/**
 * Creates a Solana Framework Kit client that uses Web3Auth's provider as the wallet.
 * Pattern: same as Wagmi — user connects with Web3Auth first, we pass the provider into the client.
 */
import type { SolanaClient } from "@solana/client";
import { createClient, createWalletStandardConnector } from "@solana/client";

import type { IProvider } from "../base";
import type { CustomChainConfig } from "../base/chain/IChainInterface";
import { createWeb3AuthWalletStandardWallet, WEB3AUTH_SOLANA_CONNECTOR_ID } from "./web3authWalletStandardAdapter";

export type CreateWeb3AuthSolanaClientParams = {
  provider: IProvider;
  chainConfig: CustomChainConfig;
};

/**
 * Creates a Framework Kit Solana client with Web3Auth as the only wallet connector.
 * Use this when the user is already connected via Web3Auth and the current chain is Solana.
 */
export function createWeb3AuthSolanaClient(params: CreateWeb3AuthSolanaClientParams): SolanaClient {
  const { provider, chainConfig } = params;
  const wallet = createWeb3AuthWalletStandardWallet({ provider, chainConfig });
  const connector = createWalletStandardConnector(wallet, {
    id: WEB3AUTH_SOLANA_CONNECTOR_ID,
    name: "Web3Auth",
  });

  const client = createClient({
    endpoint: chainConfig.rpcTarget,
    websocketEndpoint: chainConfig.wsTarget,
    walletConnectors: [connector],
  });

  return client;
}
