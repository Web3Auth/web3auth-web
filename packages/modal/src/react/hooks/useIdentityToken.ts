import { Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useEffect, useState } from "react";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseIdentityToken {
  loading: boolean;
  error: Web3AuthError | null;
  token: string | null;
  authenticateUser: () => Promise<string | null>;
}

export const useIdentityToken = () => {
  const { web3Auth, isConnected } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const authenticateUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userAuthInfo = await web3Auth.authenticateUser();
      if (userAuthInfo?.idToken) {
        setToken(userAuthInfo.idToken);
      }
      return userAuthInfo?.idToken;
    } catch (error) {
      setError(error as Web3AuthError);
    } finally {
      setLoading(false);
    }
  }, [web3Auth]);

  useEffect(() => {
    if (!isConnected && token) {
      setToken(null);
    }
  }, [isConnected, token]);

  return { loading, error, token, authenticateUser };
};
