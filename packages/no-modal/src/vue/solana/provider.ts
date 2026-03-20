import type { SolanaClient } from "@solana/client";
import { defineComponent, h, provide, ref, watch } from "vue";

import { log } from "../../base";
import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { createWeb3AuthSolanaClient, WEB3AUTH_SOLANA_CONNECTOR_ID } from "../../solana-framework-kit";
import { useChain, useWeb3Auth } from "../composables";
import { SOLANA_CLIENT_KEY } from "./constants";

/**
 * Syncs Web3Auth Solana connection with Framework Kit client.
 * When user is connected via Web3Auth and current chain is Solana, creates a Framework Kit client
 * with Web3Auth as the wallet connector and connects it (same pattern as Wagmi provider).
 */
const Web3AuthSolanaProvider = defineComponent({
  name: "Web3AuthSolanaProvider",
  setup() {
    const { isConnected, provider, web3Auth } = useWeb3Auth();
    const { chainNamespace } = useChain();
    const clientRef = ref<SolanaClient | null>(null);

    provide(SOLANA_CLIENT_KEY, clientRef);

    watch(
      [isConnected, provider, chainNamespace],
      async ([connected, prov, namespace]) => {
        const isSolana = namespace === CHAIN_NAMESPACES.SOLANA;
        if (!connected || !prov || !isSolana || !web3Auth.value?.currentChain) {
          if (clientRef.value) {
            try {
              await clientRef.value.actions.disconnectWallet();
            } catch (e) {
              log.warn("Solana client disconnect", e);
            }
            clientRef.value = null;
          }
          return;
        }

        const chainConfig = web3Auth.value.currentChain;
        if (chainConfig.chainNamespace !== CHAIN_NAMESPACES.SOLANA) return;

        try {
          const client = createWeb3AuthSolanaClient({
            provider: prov,
            chainConfig,
          });
          clientRef.value = client;
          await client.actions.connectWallet(WEB3AUTH_SOLANA_CONNECTOR_ID, {
            autoConnect: true,
          });
        } catch (err) {
          log.error("Failed to create or connect Solana client", err);
          clientRef.value = null;
        }
      },
      { immediate: true }
    );
  },
  render() {
    return h(this.$slots.default ?? "");
  },
});

export const SolanaProvider = defineComponent({
  name: "SolanaProvider",
  setup(_, { slots }) {
    return () => h(Web3AuthSolanaProvider, {}, slots.default?.());
  },
});
