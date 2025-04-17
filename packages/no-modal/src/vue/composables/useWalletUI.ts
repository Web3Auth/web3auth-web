import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { Ref, ref } from "vue";

import { WalletServicesPluginError, Web3AuthError } from "@/core/base";

import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseWalletUI {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  showWalletUI: (showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]) => Promise<void>;
}

export const useWalletUI = (): IUseWalletUI => {
  const { plugin, ready } = useWalletServicesPlugin();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const showWalletUI = async (showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]) => {
    loading.value = true;
    error.value = null;
    try {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

      await plugin.value.showWalletUi(showWalletUiParams);
    } catch (err) {
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    showWalletUI,
  };
};
