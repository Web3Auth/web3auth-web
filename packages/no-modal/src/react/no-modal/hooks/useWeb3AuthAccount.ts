import { useCallback, useEffect, useState } from "react";

import { CONNECTOR_EVENTS, UserInfo, Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthAccount {
  loading: boolean;
  error: Web3AuthError | null;
  userInfo: Partial<UserInfo> | null;
  isMFAEnabled: boolean;
  getUserInfo: () => Promise<Partial<UserInfo> | null>;
}

export const useWeb3AuthAccount = (): IUseWeb3AuthAccount => {
  const { web3Auth, isAuthenticated } = useWeb3AuthInner();

  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  const [userInfo, setUserInfo] = useState<Partial<UserInfo> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const getUserInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userInfo = await web3Auth.getUserInfo();
      setUserInfo(userInfo);
      return userInfo;
    } catch (error) {
      setError(error as Web3AuthError);
    } finally {
      setLoading(false);
    }
  }, [web3Auth]);

  useEffect(() => {
    const saveUserInfo = async () => {
      const userInfo = await getUserInfo();
      setUserInfo(userInfo);
    };

    if (isAuthenticated && !userInfo) saveUserInfo();

    if (!isAuthenticated && userInfo) {
      setUserInfo(null);
    }
  }, [isAuthenticated, userInfo, getUserInfo]);

  useEffect(() => {
    const mfaEnabledListener = async (isMFAEnabled: boolean) => {
      setIsMFAEnabled(isMFAEnabled);
      if (isMFAEnabled) {
        const userInfo = await web3Auth.getUserInfo();
        setUserInfo(userInfo);
      }
    };

    web3Auth.on(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);

    return () => {
      web3Auth.off(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);
    };
  }, [web3Auth]);

  return { loading, error, userInfo, isMFAEnabled, getUserInfo };
};
