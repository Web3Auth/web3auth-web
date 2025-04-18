import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { WalletServicesPluginError, Web3AuthError } from "@web3auth/no-modal";
import { Ref, ref } from "vue";

import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseCheckout {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  showCheckout: (showCheckoutParams?: BaseEmbedControllerState["showCheckout"]) => Promise<void>;
}

export const useCheckout = (): IUseCheckout => {
  const { plugin, ready } = useWalletServicesPlugin();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const showCheckout = async (showCheckoutParams?: BaseEmbedControllerState["showCheckout"]) => {
    loading.value = true;
    error.value = null;
    try {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

      await plugin.value.showCheckout(showCheckoutParams);
    } catch (err) {
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    showCheckout,
  };
};
