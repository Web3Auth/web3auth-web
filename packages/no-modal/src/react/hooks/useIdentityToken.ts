import { useCallback, useEffect, useState } from "react";

import { Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseIdentityToken {
  loading: boolean;
  error: Web3AuthError | null;
  token: string | null;
  getIdentityToken: () => Promise<string | null>;
}

export const useIdentityToken = () => {
  const { web3Auth, isConnected, isAuthorized } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const getIdentityToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userAuthInfo = await web3Auth.getIdentityToken();
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
    if (!web3Auth) return;
    if (!isAuthorized && token) {
      setToken(null);
    }
    if (isAuthorized && !token) {
      setToken(web3Auth.idToken);
    }
  }, [isConnected, isAuthorized, token]);

  return { loading, error, token, getIdentityToken };
};
