import { createClient, createWalletStandardConnector, type SolanaClient } from "@solana/client";
import { StandardEvents, type StandardEventsFeature } from "@wallet-standard/features";
import { defineComponent, Fragment, h, provide, ref, watch } from "vue";

import { log } from "../../base";
import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { useChain, useWeb3Auth } from "../composables";
import { SOLANA_CLIENT_KEY } from "./constants";

const disposeClient = async (client: SolanaClient) => {
  try {
    await client.actions.disconnectWallet();
  } catch (e) {
    log.warn("Solana client disconnect", e);
  }
  client.destroy();
};

/**
 * Syncs Web3Auth Solana connection with Framework Kit client.
 * When user is connected via Web3Auth and current chain is Solana, creates a Framework Kit client
 * with Web3Auth as the wallet connector and connects it (same pattern as Wagmi provider).
 */
export const SolanaProvider = defineComponent({
  name: "SolanaProvider",
  setup(_, { slots }) {
    const { isConnected, connection, web3Auth } = useWeb3Auth();
    const { chainId } = useChain();
    const clientRef = ref<SolanaClient | null>(null);
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
      if (
        !newIsConnected ||
        !newConnection?.solanaWallet ||
        currentChain?.chainNamespace !== CHAIN_NAMESPACES.SOLANA ||
        // only reconnect for the primary connector
        newConnection.connectorName !== web3Auth.value?.primaryConnectorName
      ) {
        const prevClient = clientRef.value;
        clientRef.value = null;
        if (prevClient) {
          await disposeClient(prevClient);
        }
        return;
      }

      const prevClient = clientRef.value;
      clientRef.value = null;
      if (prevClient) {
        await disposeClient(prevClient);
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
        const { rpcTarget, wsTarget } = currentChain;
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
        clientRef.value = client;
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

    watch(
      () => connection.value?.solanaWallet ?? null,
      (wallet, _, onCleanup) => {
        if (!wallet) {
          return;
        }

        const standardEvents = (wallet.features as Partial<StandardEventsFeature>)[StandardEvents];
        if (!standardEvents) {
          return;
        }

        // Wallet-standard `change` is imperative, so route it through the same sync path
        // used by chain/connection watchers to rebuild the Framework Kit client.
        const unsubscribe = standardEvents.on("change", () => {
          void syncClient();
        });
        onCleanup(() => {
          unsubscribe();
        });
      },
      { immediate: true }
    );

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
