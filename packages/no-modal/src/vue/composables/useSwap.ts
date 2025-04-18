import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { Ref, ref } from "vue";

import { WalletServicesPluginError, Web3AuthError } from "@/core/base";

import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseSwap {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  showSwap: (showSwapParams?: BaseEmbedControllerState["showSwap"]) => Promise<void>;
}

export const useSwap = (): IUseSwap => {
  const { plugin, ready } = useWalletServicesPlugin();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const showSwap = async (showSwapParams?: BaseEmbedControllerState["showSwap"]) => {
    loading.value = true;
    error.value = null;
    try {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

      await plugin.value.showSwap(showSwapParams);
    } catch (err) {
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    showSwap,
  };
};
