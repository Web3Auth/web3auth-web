import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { WalletServicesPluginError, Web3AuthError } from "@web3auth/no-modal";
import { Ref, ref } from "vue";

import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseFunding {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  showFunding: (showFundingParams?: BaseEmbedControllerState["showFunding"]) => Promise<void>;
}

export const useFunding = (): IUseFunding => {
  const { plugin, ready } = useWalletServicesPlugin();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const showFunding = async (showFundingParams?: BaseEmbedControllerState["showFunding"]) => {
    loading.value = true;
    error.value = null;
    try {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

      await plugin.value.showFunding(showFundingParams);
    } catch (err) {
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    showFunding,
  };
};
