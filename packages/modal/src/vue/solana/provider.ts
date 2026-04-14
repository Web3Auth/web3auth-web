import { createClient, createWalletStandardConnector, type SolanaClient } from "@solana/client";
import { CHAIN_NAMESPACES, type CustomChainConfig, log } from "@web3auth/no-modal";
import { defineComponent, Fragment, h, provide, ref, watch } from "vue";

import { useWeb3Auth } from "../composables";
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
    const clientRef = ref<SolanaClient | null>(null);

    // provide the client to the app
    provide(SOLANA_CLIENT_KEY, clientRef);

    // watch for changes in the connection and chain namespace
    watch(
      [isConnected, connection],
      async ([newIsConnected, newConnection]) => {
        if (!newIsConnected || !newConnection?.solanaWallet) {
          if (clientRef.value) {
            await disposeClient(clientRef.value);
            clientRef.value = null;
          }
          return;
        }

        const currentChain = web3Auth.value.currentChain;
        let chainConfig: CustomChainConfig;
        if (currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA) {
          chainConfig = currentChain;
        } else {
          // use the 1st Solana chain if current chain is not solana
          chainConfig = web3Auth.value.coreOptions.chains.find((c) => c.chainNamespace === CHAIN_NAMESPACES.SOLANA);
          if (!chainConfig) return;
        }

        const prevClient = clientRef.value;
        try {
          // create a wallet standard connector from connected wallet
          const solanaWalletId = "wallet-standard:" + connection.value.connectorName;
          const connector = createWalletStandardConnector(connection.value.solanaWallet, {
            id: solanaWalletId,
            name: connection.value.connectorName,
          });

          // create a solana client
          const { rpcTarget, wsTarget } = chainConfig;
          const client = createClient({
            endpoint: rpcTarget,
            websocketEndpoint: wsTarget,
            walletConnectors: [connector],
          });
          clientRef.value = client;
          if (prevClient) await disposeClient(prevClient);

          // connect the client to the wallet
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
