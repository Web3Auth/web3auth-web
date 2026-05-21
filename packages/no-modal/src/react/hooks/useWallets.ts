import { useCallback, useState } from "react";

import { ConnectedAccountsWithProviders, WalletInitializationError, Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWallets {
  loading: boolean;
  error: Web3AuthError | null;
  wallets: ConnectedAccountsWithProviders[];
  syncWallets(): Promise<void>;
}

export const useWallets = (): IUseWallets => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [wallets, setWallets] = useState<ConnectedAccountsWithProviders[]>([]);

  const syncWallets = useCallback(async (): Promise<void> => {
    if (!web3Auth) throw WalletInitializationError.notReady();
    setLoading(true);
    setError(null);
    try {
      const result = await web3Auth.getConnectedAccountsWithProviders();
      setWallets(result);
    } catch (err) {
      setError(err as Web3AuthError);
    } finally {
      setLoading(false);
    }
  }, [web3Auth]);

  return { loading, error, wallets, syncWallets };
};
