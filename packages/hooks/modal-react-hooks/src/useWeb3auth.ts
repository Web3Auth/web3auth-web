import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  type ADAPTER_STATUS_TYPE,
  CustomChainConfig,
  type IPlugin,
  type IProvider,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { type ModalConfig } from "@web3auth/modal";
import { type LoginParams, type OpenloginUserInfo } from "@web3auth/openlogin-adapter";
import { useCallback, useContext, useEffect, useState } from "react";

import { Web3AuthContext } from "./Web3AuthProvider";

export const useWeb3Auth = () => {
  const web3auth = useContext(Web3AuthContext);

  const [isConnected, setConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [userInfo, setUserInfo] = useState<Partial<OpenloginUserInfo> | null>(null);
  const [isMFAEnabled, setIsMFAEnabled] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [status, setStatus] = useState<ADAPTER_STATUS_TYPE | null>(null);

  useEffect(() => {
    const addState = async () => {
      setProvider(web3auth.provider);
      const userState = await web3auth.getUserInfo();
      setUserInfo(userState);
      setIsMFAEnabled(userState?.isMfaEnabled || false);
    };

    const resetState = () => {
      setProvider(null);
      setUserInfo(null);
      setIsMFAEnabled(false);
    };

    if (web3auth) {
      if (isConnected) addState();
      else resetState();
    }
  }, [web3auth, isConnected]);

  useEffect(() => {
    if (web3auth?.status) {
      setStatus(web3auth.status);
      // we want initialized to be true in case of any status other than NOT_READY
      setIsInitialized(web3auth.status !== ADAPTER_STATUS.NOT_READY);
    }
  }, [web3auth?.status]);

  const initModal = useCallback(
    async (params: { modalConfig?: Record<string, ModalConfig> } = {}) => {
      if (!web3auth) throw WalletInitializationError.notReady();
      await web3auth.initModal(params);
    },
    [web3auth]
  );

  useEffect(() => {
    if (web3auth) {
      web3auth.on(ADAPTER_EVENTS.CONNECTED, () => setConnected(true));
      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => setConnected(false));
    }
  }, [web3auth]);

  const enableMFA = useCallback(
    async (params: Partial<LoginParams>) => {
      if (!web3auth) throw WalletInitializationError.notReady();
      if (!isConnected) throw WalletLoginError.notConnectedError();
      await web3auth.enableMFA(params);
      setIsMFAEnabled(true);
    },
    [web3auth, isConnected]
  );

  const logout = useCallback(
    async (params: { cleanup: boolean } = { cleanup: false }) => {
      if (!web3auth) throw WalletInitializationError.notReady();
      if (!isConnected) throw WalletLoginError.notConnectedError();

      await web3auth.logout(params);
    },
    [web3auth, isConnected]
  );

  const connect = useCallback(async () => {
    if (!web3auth) throw WalletInitializationError.notReady();
    const localProvider = await web3auth.connect();
    return localProvider;
  }, [web3auth]);

  const addAndSwitchChain = useCallback(
    async (chainConfig: CustomChainConfig) => {
      if (!web3auth) throw WalletInitializationError.notReady();
      await web3auth.addChain(chainConfig);

      await web3auth.switchChain({ chainId: chainConfig.chainId });
    },
    [web3auth]
  );

  const addPlugin = useCallback(
    (plugin: IPlugin) => {
      if (!web3auth) throw WalletInitializationError.notReady();
      return web3auth.addPlugin(plugin);
    },
    [web3auth]
  );

  const authenticateUser = useCallback(async () => {
    if (!web3auth) throw WalletInitializationError.notReady();
    return web3auth.authenticateUser();
  }, [web3auth]);

  const addChain = useCallback(
    async (chainConfig: CustomChainConfig) => {
      if (!web3auth) throw WalletInitializationError.notReady();
      return web3auth.addChain(chainConfig);
    },
    [web3auth]
  );

  const switchChain = useCallback(
    (params: { chainId: string }) => {
      if (!web3auth) throw WalletInitializationError.notReady();
      return web3auth.switchChain(params);
    },
    [web3auth]
  );

  return {
    web3auth,
    isConnected,
    isInitialized,
    provider,
    userInfo,
    isMFAEnabled,
    status,
    initModal,
    connect,
    enableMFA,
    logout,
    addAndSwitchChain,
    addChain,
    addPlugin,
    authenticateUser,
    switchChain,
  };
};
