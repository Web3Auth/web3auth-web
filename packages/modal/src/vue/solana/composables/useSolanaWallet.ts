import { Connection } from "@solana/web3.js";
import { CHAIN_NAMESPACES, SolanaWallet } from "@web3auth/no-modal";
import { Ref, ref, ShallowRef, shallowRef, watch } from "vue";

import { useWeb3Auth } from "../../composables";

export type IUseSolanaWallet = {
  accounts: Ref<string[] | null>;
  solanaWallet: ShallowRef<SolanaWallet | null>;
  connection: ShallowRef<Connection | null>;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { provider, web3Auth } = useWeb3Auth();
  const accounts = ref<string[]>([]);
  const solanaWallet = shallowRef<SolanaWallet | null>(null);
  const connection = shallowRef<Connection | null>(null);

  const setupWallet = async () => {
    if (!web3Auth.value?.currentChain?.chainNamespace || web3Auth.value.currentChain.chainNamespace !== CHAIN_NAMESPACES.SOLANA) {
      return;
    }
    solanaWallet.value = new SolanaWallet(provider.value);
    const result = await solanaWallet.value.getAccounts();
    if (result?.length > 0) {
      accounts.value = result;
    }
    connection.value = new Connection(web3Auth.value?.currentChain?.rpcTarget);
  };

  if (provider.value && !solanaWallet.value) {
    setupWallet();
  }

  watch(
    provider,
    async (newVal) => {
      if (!newVal && solanaWallet.value) {
        solanaWallet.value = null;
        accounts.value = null;
        connection.value = null;
        return;
      }

      if (newVal && !solanaWallet.value) {
        setupWallet();
      }
    },
    { immediate: true }
  );

  return { solanaWallet, accounts, connection };
};
