import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { useCallback, useState } from "react";

import { WalletServicesPluginError, Web3AuthError } from "../../base";
import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseReceive {
  loading: boolean;
  error: Web3AuthError | null;
  showReceive: (showReceiveParams?: BaseEmbedControllerState["showReceive"]) => Promise<void>;
}

export const useReceive = (): IUseReceive => {
  const { plugin, ready } = useWalletServicesPlugin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const showReceive = useCallback(
    async (showReceiveParams?: BaseEmbedControllerState["showReceive"]) => {
      setLoading(true);
      setError(null);
      try {
        if (!plugin) throw WalletServicesPluginError.notInitialized();
        if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

        await plugin.showReceive(showReceiveParams);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [plugin, ready]
  );

  return { loading, error, showReceive };
};
