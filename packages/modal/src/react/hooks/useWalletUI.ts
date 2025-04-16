import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { WalletServicesPluginError, Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseWalletUI {
  loading: boolean;
  error: Web3AuthError | null;
  showWalletUI: (showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]) => Promise<void>;
}

export const useWalletUI = (): IUseWalletUI => {
  const { plugin, ready } = useWalletServicesPlugin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const showWalletUI = useCallback(
    async (showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]) => {
      setLoading(true);
      setError(null);
      try {
        if (!plugin) throw WalletServicesPluginError.notInitialized();
        if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

        await plugin.showWalletUi(showWalletUiParams);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [plugin, ready]
  );

  return { loading, error, showWalletUI };
};
