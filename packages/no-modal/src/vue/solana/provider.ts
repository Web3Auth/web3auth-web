import { createClient, createWalletStandardConnector, type SolanaClient } from "@solana/client";
import { defineComponent, Fragment, h, provide, ref, watch } from "vue";

import { log } from "../../base";
import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { useChain, useWeb3Auth } from "../composables";
import { SOLANA_CLIENT_KEY } from "./constants";

/**
 * Syncs Web3Auth Solana connection with Framework Kit client.
 * When user is connected via Web3Auth and current chain is Solana, creates a Framework Kit client
 * with Web3Auth as the wallet connector and connects it (same pattern as Wagmi provider).
 */
export const SolanaProvider = defineComponent({
  name: "SolanaProvider",
  setup(_, { slots }) {
    const { isConnected, connection, web3Auth } = useWeb3Auth();
    const { chainNamespace } = useChain();
    const clientRef = ref<SolanaClient | null>(null);

    provide(SOLANA_CLIENT_KEY, clientRef);

    watch(
      [isConnected, connection, chainNamespace],
      async ([connected, prov, namespace]) => {
        const isSolana = namespace === CHAIN_NAMESPACES.SOLANA;

        const disposeClient = async (client: SolanaClient) => {
          try {
            await client.actions.disconnectWallet();
          } catch (e) {
            log.warn("Solana client disconnect", e);
          }
          client.destroy();
        };

        if (!connected || !prov || !isSolana || !web3Auth.value?.currentChain) {
          if (clientRef.value) {
            await disposeClient(clientRef.value);
            clientRef.value = null;
          }
          return;
        }

        const chainConfig = web3Auth.value.currentChain;
        if (chainConfig.chainNamespace !== CHAIN_NAMESPACES.SOLANA) return;

        const prevClient = clientRef.value;
        try {
          const solanaWalletId = "wallet-standard:" + connection.value.connectorName;
          const connector = createWalletStandardConnector(connection.value.solanaWallet, {
            id: solanaWalletId,
            name: connection.value.connectorName,
          });
          const { rpcTarget, wsTarget } = chainConfig;
          const client = createClient({
            endpoint: rpcTarget,
            websocketEndpoint: wsTarget,
            walletConnectors: [connector],
          });
          clientRef.value = client;
          if (prevClient) await disposeClient(prevClient);
          await client.actions.connectWallet(solanaWalletId, {
            autoConnect: true,
          });
        } catch (err) {
          log.error("Failed to create or connect Solana client", err);
          clientRef.value = null;
        }
      },
      { immediate: true }
    );

    return () => h(Fragment, null, slots.default?.() ?? []);
  },
});
