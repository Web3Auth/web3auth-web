import { createClient, createWalletStandardConnector, type SolanaClient } from "@solana/client";
import { defineComponent, Fragment, h, provide, ref, watch } from "vue";

import { log } from "../../base";
import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
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
 *
 * The client is only created/connected while the embedded provider is on a Solana chain. This
 * prevents Wallet-Standard `connect` from triggering `GET_ACCOUNTS` against an EVM provider,
 * which would throw `WalletLoginError.unsupportedOperation` from `AuthSolanaWallet.ensureAccountsLoaded`.
 */
export const SolanaProvider = defineComponent({
  name: "SolanaProvider",
  setup(_, { slots }) {
    const { isConnected, connection, chainNamespace, web3Auth } = useWeb3Auth();
    const clientRef = ref<SolanaClient | null>(null);

    provide(SOLANA_CLIENT_KEY, clientRef);

    watch(
      [isConnected, connection, chainNamespace],
      async ([newIsConnected, newConnection, newChainNamespace]) => {
        const currentChain = web3Auth.value?.currentChain;
        const onSolana =
          newIsConnected &&
          Boolean(newConnection?.solanaWallet) &&
          newChainNamespace === CHAIN_NAMESPACES.SOLANA &&
          currentChain?.chainNamespace === CHAIN_NAMESPACES.SOLANA;

        if (!onSolana) {
          if (clientRef.value) {
            await disposeClient(clientRef.value);
            clientRef.value = null;
          }
          return;
        }

        // only reconnect for the primary connector
        if (newConnection.connectorName !== web3Auth.value?.primaryConnectorName) return;

        const prevClient = clientRef.value;
        try {
          const solanaWalletId = "wallet-standard:" + newConnection.connectorName;
          const connector = createWalletStandardConnector(newConnection.solanaWallet, {
            id: solanaWalletId,
            name: newConnection.connectorName,
          });

          const { rpcTarget, wsTarget } = currentChain;
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
