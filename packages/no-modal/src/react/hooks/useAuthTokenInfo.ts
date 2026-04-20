import { useCallback, useEffect, useState } from "react";

import { Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseAuthTokenInfo {
  loading: boolean;
  error: Web3AuthError | null;
  token: string | null;
  getAuthTokenInfo: () => Promise<string | null>;
}

export const useAuthTokenInfo = () => {
  const { web3Auth, isAuthorized } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const getAuthTokenInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userAuthInfo = await web3Auth.getAuthTokenInfo();
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
  }, [isAuthorized, token, web3Auth]);

  return { loading, error, token, getAuthTokenInfo };
};
