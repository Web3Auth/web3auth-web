import { BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { useCallback, useState } from "react";

import { WalletServicesPluginError, Web3AuthError } from "../../base";
import { useWalletServicesPlugin } from "./useWalletServicesPlugin";

export interface IUseFunding {
  loading: boolean;
  error: Web3AuthError | null;
  showFunding: (showFundingParams?: BaseEmbedControllerState["showFunding"]) => Promise<void>;
}

export const useFunding = (): IUseFunding => {
  const { plugin, ready } = useWalletServicesPlugin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const showFunding = useCallback(
    async (showFundingParams?: BaseEmbedControllerState["showFunding"]) => {
      setLoading(true);
      setError(null);
      try {
        if (!plugin) throw WalletServicesPluginError.notInitialized();
        if (!ready) throw WalletServicesPluginError.walletPluginNotConnected();

        await plugin.showFunding(showFundingParams);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [plugin, ready]
  );

  return { loading, error, showFunding };
};
