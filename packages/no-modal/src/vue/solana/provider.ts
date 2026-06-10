import { createClient, createWalletStandardConnector, type SolanaClient } from "@solana/client";
import { defineComponent, Fragment, h, provide, ref, watch } from "vue";

import { type Connection, getCaipChainId, log } from "../../base";
import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { useChain, useWeb3Auth } from "../composables";
import { SOLANA_CLIENT_KEY } from "./constants";

const disposeClient = async (client: SolanaClient) => {
  client.destroy();
};

const resolveSolanaChain = (web3Auth: ReturnType<typeof useWeb3Auth>["web3Auth"]["value"], connection: Connection | null) => {
  const currentChain = web3Auth?.currentChain;
  if (currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return currentChain;
  }

  const connectedScope =
    connection?.solanaWallet && "scope" in connection.solanaWallet && typeof connection.solanaWallet.scope === "string"
      ? connection.solanaWallet.scope
      : null;

  if (connectedScope) {
    const connectedChain = web3Auth?.coreOptions.chains?.find((chain) => {
      return chain.chainNamespace === CHAIN_NAMESPACES.SOLANA && getCaipChainId(chain) === connectedScope;
    });
    if (connectedChain) return connectedChain;
  }

  return web3Auth?.coreOptions.chains?.find((chain) => chain.chainNamespace === CHAIN_NAMESPACES.SOLANA) || null;
};

/**
 * Syncs Web3Auth Solana connection with Framework Kit client.
 * For multichain wallets, keep the Solana client warm across namespace switches so
 * switching back to Solana can reuse the existing wallet session.
 */
export const SolanaProvider = defineComponent({
  name: "SolanaProvider",
  setup(_, { slots }) {
    const { isConnected, connection, web3Auth } = useWeb3Auth();
    const { chainId } = useChain();
    const clientRef = ref<SolanaClient | null>(null);
    let connectedClient: SolanaClient | null = null;
    // let connectedClientKey: string | null = null;
    // Holds the token for the newest requested sync run. Older async runs compare against it
    // before publishing results so a slower reconnect cannot overwrite a newer chain/account update.
    let activeSyncToken: symbol | null = null;

    // provide the client to the app
    provide(SOLANA_CLIENT_KEY, clientRef);

    const syncClient = async () => {
      // Only the latest async, `syncing` run should be allowed to attach its client.
      // A fresh Symbol gives each run a unique identity without relying on counters.
      const syncToken = Symbol("solana-client-sync");
      activeSyncToken = syncToken;

      const newIsConnected = isConnected.value;
      const newConnection = connection.value;
      const currentChain = web3Auth.value?.currentChain;
      if (currentChain?.chainNamespace !== CHAIN_NAMESPACES.SOLANA) {
        return;
      }
      const preferredSolanaChain = resolveSolanaChain(web3Auth.value, newConnection);
      const shouldKeepSolanaClient =
        newIsConnected &&
        Boolean(newConnection?.solanaWallet) &&
        Boolean(preferredSolanaChain) &&
        // only manage the client for the primary connector
        newConnection?.connectorName === web3Auth.value?.primaryConnectorName;

      if (!shouldKeepSolanaClient) {
        clientRef.value = null;
        const prevClient = connectedClient;
        connectedClient = null;
        // connectedClientKey = null;
        if (prevClient) {
          await disposeClient(prevClient);
        }
        return;
      }

      let client: SolanaClient | null = null;
      try {
        // create a wallet standard connector from connected wallet
        const solanaWalletId = "wallet-standard:" + newConnection.connectorName;
        const connector = createWalletStandardConnector(newConnection.solanaWallet, {
          id: solanaWalletId,
          name: newConnection.connectorName,
        });

        // create a solana client
        const { rpcTarget, wsTarget } = preferredSolanaChain;
        client = createClient({
          endpoint: rpcTarget,
          websocketEndpoint: wsTarget,
          walletConnectors: [connector],
        });

        // connect the client to the wallet
        await client.actions.connectWallet(solanaWalletId, {
          autoConnect: true,
        });
        // If another sync started while connectWallet was in flight, this client is stale.
        if (activeSyncToken !== syncToken) {
          await disposeClient(client);
          return;
        }
        const prevClient = connectedClient;
        connectedClient = client;
        // connectedClientKey = nextClientKey;
        clientRef.value = currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA ? client : null;
        if (prevClient) {
          await disposeClient(prevClient);
        }
      } catch (err) {
        if (client) {
          await disposeClient(client);
        }
        log.error("Failed to create or connect Solana client", err);
        // Only clear the shared ref when this failing run is still the newest one.
        if (activeSyncToken === syncToken) {
          clientRef.value = null;
        }
      }
    };

    // watch for changes in the connection and active chain
    watch(
      [isConnected, connection, chainId],
      () => {
        void syncClient();
      },
      { immediate: true }
    );

    return () => h(Fragment, null, slots.default?.() ?? []);
  },
});
