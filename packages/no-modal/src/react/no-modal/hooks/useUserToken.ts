import { useCallback, useState } from "react";

import { Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseUserToken {
  isLoading: boolean;
  error: Web3AuthError | null;
  token: string | null;
  authenticateUser: () => Promise<string | null>;
}

export const useUserToken = () => {
  const { web3Auth } = useWeb3AuthInner();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const authenticateUser = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [web3Auth]);

  return { isLoading, error, token, authenticateUser };
};
