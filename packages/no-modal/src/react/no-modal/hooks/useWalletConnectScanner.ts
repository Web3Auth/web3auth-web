import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { useCallback, useState } from "react";

import { WalletServicesPluginError, Web3AuthError } from "@/core/base";

import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseWalletConnectScanner {
  loading: boolean;
  error: Web3AuthError | null;
  showWalletConnectScanner: (showWalletConnectScannerParams?: BaseEmbedControllerState["showWalletConnect"]) => Promise<void>;
}

export const useWalletConnectScanner = (): IUseWalletConnectScanner => {
  const { plugin, isConnected } = useWalletServicesPlugin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const showWalletConnectScanner = useCallback(
    async (showWalletConnectScannerParams?: BaseEmbedControllerState["showWalletConnect"]) => {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!isConnected) throw WalletServicesPluginError.walletPluginNotConnected();

      setLoading(true);
      setError(null);
      try {
        await plugin.showWalletConnectScanner(showWalletConnectScannerParams);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [plugin, isConnected]
  );

  return { loading, error, showWalletConnectScanner };
};
