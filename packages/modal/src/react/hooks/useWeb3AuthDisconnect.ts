import { Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthDisconnect {
  loading: boolean;
  error: Web3AuthError | null;
  disconnect(options?: { cleanup: boolean }): Promise<void>;
}

export const useWeb3AuthDisconnect = (): IUseWeb3AuthDisconnect => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const disconnect = useCallback(
    async (options?: { cleanup: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        await web3Auth.logout(options);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  return { loading, error, disconnect };
};
