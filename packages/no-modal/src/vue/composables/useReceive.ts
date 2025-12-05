import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { Ref, ref } from "vue";

import { log, WalletServicesPluginError, Web3AuthError } from "../../base";
import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseReceive {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  showReceive: (showReceiveParams?: BaseEmbedControllerState["showReceive"]) => Promise<void>;
}

export const useReceive = (): IUseReceive => {
  const { plugin, ready } = useWalletServicesPlugin();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const showReceive = async (showReceiveParams?: BaseEmbedControllerState["showReceive"]) => {
    loading.value = true;
    error.value = null;
    try {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

      await plugin.value.showReceive(showReceiveParams);
    } catch (err) {
      log.error("Error showing receive", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    showReceive,
  };
};
