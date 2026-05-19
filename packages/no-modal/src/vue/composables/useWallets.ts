import { Ref, ref } from "vue";

import { type ConnectedAccountsWithProviders, log, WalletInitializationError, Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWallets {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  wallets: Ref<ConnectedAccountsWithProviders[]>;
  syncWallets(): Promise<void>;
}

export const useWallets = (): IUseWallets => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const wallets = ref<ConnectedAccountsWithProviders[]>([]);

  const syncWallets = async (): Promise<void> => {
    if (!web3Auth.value) throw WalletInitializationError.notReady();
    error.value = null;
    loading.value = true;
    try {
      const result = await web3Auth.value.getConnectedAccountsWithProviders();
      wallets.value = result;
    } catch (err) {
      log.error("Error getting wallets", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, wallets, syncWallets };
};
