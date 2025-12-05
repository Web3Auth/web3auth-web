import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { Ref, ref } from "vue";

import { log, WalletServicesPluginError, Web3AuthError } from "../../base";
import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseWalletConnectScanner {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  showWalletConnectScanner: (showWalletConnectScannerParams?: BaseEmbedControllerState["showWalletConnect"]) => Promise<void>;
}

export const useWalletConnectScanner = (): IUseWalletConnectScanner => {
  const { plugin, ready } = useWalletServicesPlugin();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const showWalletConnectScanner = async (showWalletConnectScannerParams?: BaseEmbedControllerState["showWalletConnect"]) => {
    loading.value = true;
    error.value = null;
    try {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

      await plugin.value.showWalletConnectScanner(showWalletConnectScannerParams);
    } catch (err) {
      log.error("Error showing wallet connect scanner", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    showWalletConnectScanner,
  };
};
