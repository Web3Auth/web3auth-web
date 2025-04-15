import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { WalletServicesPluginError, Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseCheckout {
  loading: boolean;
  error: Web3AuthError | null;
  showCheckout: (showCheckoutParams?: BaseEmbedControllerState["showCheckout"]) => Promise<void>;
}

export const useCheckout = (): IUseCheckout => {
  const { plugin, isConnected } = useWalletServicesPlugin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const showCheckout = useCallback(
    async (showCheckoutParams?: BaseEmbedControllerState["showCheckout"]) => {
      if (!plugin) throw WalletServicesPluginError.notInitialized();
      if (!isConnected) throw WalletServicesPluginError.walletPluginNotConnected();

      setLoading(true);
      setError(null);
      try {
        await plugin.showCheckout(showCheckoutParams);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [plugin, isConnected]
  );

  return { loading, error, showCheckout };
};
