import { Ref, ref, ShallowRef, shallowRef, watch } from "vue";

import { SolanaWallet } from "../../../providers/solana-provider/solanaWallet";
import { useWeb3Auth } from "../../composables";

export type IUseSolanaWallet = {
  accounts: Ref<string[] | null>;
  solanaWallet: ShallowRef<SolanaWallet | null>;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { provider } = useWeb3Auth();
  const accounts = ref<string[]>([]);
  const solanaWallet = shallowRef<SolanaWallet | null>(null);

  watch(provider, async (newVal) => {
    if (!newVal && solanaWallet.value) {
      solanaWallet.value = null;
      accounts.value = null;
      return;
    }
    if (!solanaWallet.value) {
      solanaWallet.value = new SolanaWallet(newVal);
    }

    if (accounts.value?.length === 0) {
      const result = await solanaWallet.value.requestAccounts();
      if (result?.length > 0) {
        accounts.value = result;
      }
    }
  });

  return { solanaWallet, accounts };
};
