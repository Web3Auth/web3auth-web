import { useCallback, useState } from "react";

import { ConnectedAccountInfo, Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseSwitchAccount {
  loading: boolean;
  error: Web3AuthError | null;
  switchAccount(account: ConnectedAccountInfo): Promise<void>;
}

export const useSwitchAccount = (): IUseSwitchAccount => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const switchAccount = useCallback(
    async (account: ConnectedAccountInfo): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await web3Auth.switchAccount(account);
      } catch (err) {
        setError(err as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  return { loading, error, switchAccount };
};
