import { Connection } from "@solana/web3.js";
import { CHAIN_NAMESPACES, SolanaWallet } from "@web3auth/no-modal";
import { computed, Ref, ref, ShallowRef, shallowRef, watch } from "vue";

import { useChain, useWeb3Auth } from "../../composables";

export type IUseSolanaWallet = {
  accounts: Ref<string[] | null>;
  solanaWallet: ShallowRef<SolanaWallet | null>;
  connection: ShallowRef<Connection | null>;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { provider, web3Auth } = useWeb3Auth();
  const { chainNamespace } = useChain();
  const accounts = ref<string[]>([]);
  const solanaWallet = shallowRef<SolanaWallet | null>(null);
  const connection = shallowRef<Connection | null>(null);

  const isSolana = computed(() => chainNamespace.value === CHAIN_NAMESPACES.SOLANA);

  const setupWallet = async () => {
    if (!isSolana.value) {
      return;
    }
    if (!provider.value) {
      return;
    }
    solanaWallet.value = new SolanaWallet(provider.value);
    const result = await solanaWallet.value.getAccounts();
    if (result?.length > 0) {
      accounts.value = result;
    }
    if (web3Auth.value?.currentChain?.rpcTarget) {
      connection.value = new Connection(web3Auth.value.currentChain.rpcTarget);
    }
  };

  const resetWallet = () => {
    solanaWallet.value = null;
    accounts.value = null;
    connection.value = null;
  };

  if (provider.value && !solanaWallet.value) {
    setupWallet();
  }

  watch(
    [provider, chainNamespace],
    async ([newProvider, newChainNamespace]) => {
      if (!newProvider || newChainNamespace !== CHAIN_NAMESPACES.SOLANA) {
        if (solanaWallet.value) {
          resetWallet();
        }
        return;
      }

      if (newProvider && !solanaWallet.value) {
        setupWallet();
      }
    },
    { immediate: true }
  );

  return { solanaWallet, accounts, connection };
};
