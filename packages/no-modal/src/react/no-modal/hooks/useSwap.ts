import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { useCallback, useState } from "react";

import { WalletServicesPluginError, Web3AuthError } from "@/core/base";

import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseSwap {
  loading: boolean;
  error: Web3AuthError | null;
  showSwap: (showSwapParams?: BaseEmbedControllerState["showSwap"]) => Promise<void>;
}

export const useSwap = (): IUseSwap => {
  const { plugin, isConnected } = useWalletServicesPlugin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const showSwap = useCallback(
    async (showSwapParams?: BaseEmbedControllerState["showSwap"]) => {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!isConnected) throw WalletServicesPluginError.walletPluginNotConnected();

      setLoading(true);
      setError(null);
      try {
        await plugin.showSwap(showSwapParams);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [plugin, isConnected]
  );

  return { loading, error, showSwap };
};
