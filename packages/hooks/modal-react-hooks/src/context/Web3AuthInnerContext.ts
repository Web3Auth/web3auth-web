import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  CustomChainConfig,
  type IPlugin,
  IProvider,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import type { AuthUserInfo, LoginParams } from "@web3auth/openlogin-adapter";
import { createContext, createElement, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";

import { IWeb3AuthInnerContext, Web3AuthProviderProps } from "../interfaces";

export const Web3AuthInnerContext = createContext<IWeb3AuthInnerContext>(null);

export function Web3AuthInnerProvider(params: PropsWithChildren<Web3AuthProviderProps>) {
  const { children, config } = params;
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [connectError, setConnectError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [userInfo, setUserInfo] = useState<Partial<AuthUserInfo> | null>(null);
  const [isMFAEnabled, setIsMFAEnabled] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [status, setStatus] = useState<ADAPTER_STATUS_TYPE | null>(null);

  const addPlugin = useCallback(
    (plugin: IPlugin) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      return web3Auth.addPlugin(plugin);
    },
    [web3Auth]
  );

  const getPlugin = useCallback(
    (name: string) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      return web3Auth.getPlugin(name);
    },
    [web3Auth]
  );

  const enableMFA = useCallback(
    async (loginParams: Partial<LoginParams>) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      if (!isConnected) throw WalletLoginError.notConnectedError();
      await web3Auth.enableMFA(loginParams);
      const localUserInfo = await web3Auth.getUserInfo();
      setUserInfo(localUserInfo);
      setIsMFAEnabled(localUserInfo.isMfaEnabled || false);
    },
    [web3Auth, isConnected]
  );

  const logout = useCallback(
    async (logoutParams: { cleanup: boolean } = { cleanup: false }) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      if (!isConnected) throw WalletLoginError.notConnectedError();

      await web3Auth.logout(logoutParams);
    },
    [web3Auth, isConnected]
  );

  const connect = useCallback(async () => {
    if (!web3Auth) throw WalletInitializationError.notReady();
    try {
      setConnectError(null);
      setIsConnecting(true);
      const localProvider = await web3Auth.connect();
      return localProvider;
    } catch (error) {
      setConnectError(error as Error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [web3Auth]);

  const addAndSwitchChain = useCallback(
    async (chainConfig: CustomChainConfig) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      await web3Auth.addChain(chainConfig);

      await web3Auth.switchChain({ chainId: chainConfig.chainId });
    },
    [web3Auth]
  );

  const authenticateUser = useCallback(async () => {
    if (!web3Auth) throw WalletInitializationError.notReady();
    return web3Auth.authenticateUser();
  }, [web3Auth]);

  const addChain = useCallback(
    async (chainConfig: CustomChainConfig) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      return web3Auth.addChain(chainConfig);
    },
    [web3Auth]
  );

  const switchChain = useCallback(
    (chainParams: { chainId: string }) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      return web3Auth.switchChain(chainParams);
    },
    [web3Auth]
  );

  useEffect(() => {
    const resetHookState = () => {
      setProvider(null);
      setUserInfo(null);
      setIsMFAEnabled(false);
      setIsConnected(false);
      setStatus(null);
    };

    resetHookState();
    const { web3AuthOptions, adapters = [], plugins = [] } = config;
    const web3AuthInstance = new Web3Auth(web3AuthOptions);
    if (adapters.length) adapters.map((adapter) => web3AuthInstance.configureAdapter(adapter));
    if (plugins.length) {
      plugins.forEach((plugin) => {
        web3AuthInstance.addPlugin(plugin);
      });
    }
    setWeb3Auth(web3AuthInstance);
  }, [config]);

  useEffect(() => {
    async function init() {
      try {
        setInitError(null);
        setIsInitializing(true);
        const { modalConfig } = config;
        if (modalConfig) {
          await web3Auth.initModal({ modalConfig });
        } else {
          await web3Auth.initModal();
        }
      } catch (error) {
        setInitError(error as Error);
      } finally {
        setIsInitializing(false);
      }
    }

    if (web3Auth) init();
  }, [web3Auth, config]);

  useEffect(() => {
    const addState = async () => {
      setProvider(web3Auth.provider);
      const userState = await web3Auth.getUserInfo();
      setUserInfo(userState);
      setIsMFAEnabled(userState?.isMfaEnabled || false);
    };

    const resetState = () => {
      setProvider(null);
      setUserInfo(null);
      setIsMFAEnabled(false);
    };

    if (web3Auth) {
      if (isConnected) addState();
      else resetState();
    }
  }, [web3Auth, isConnected]);

  useEffect(() => {
    const notReadyListener = () => setStatus(web3Auth.status);
    const readyListener = () => {
      setStatus(web3Auth.status);
      setIsInitialized(true);
    };
    const connectedListener = () => {
      setStatus(web3Auth.status);
      setIsInitialized(true);
      setIsConnected(true);
    };
    const disconnectedListener = () => {
      setStatus(web3Auth.status);
      setIsConnected(false);
    };
    const connectingListener = () => {
      setStatus(web3Auth.status);
    };
    const errorListener = () => {
      setStatus(ADAPTER_STATUS.ERRORED);
    };
    if (web3Auth) {
      // web3Auth is initialized here.
      setStatus(web3Auth.status);
      web3Auth.on(ADAPTER_EVENTS.NOT_READY, notReadyListener);
      web3Auth.on(ADAPTER_EVENTS.READY, readyListener);
      web3Auth.on(ADAPTER_EVENTS.CONNECTED, connectedListener);
      web3Auth.on(ADAPTER_EVENTS.DISCONNECTED, disconnectedListener);
      web3Auth.on(ADAPTER_EVENTS.CONNECTING, connectingListener);
      web3Auth.on(ADAPTER_EVENTS.ERRORED, errorListener);
    }

    return () => {
      if (web3Auth) {
        web3Auth.off(ADAPTER_EVENTS.NOT_READY, notReadyListener);
        web3Auth.off(ADAPTER_EVENTS.READY, readyListener);
        web3Auth.off(ADAPTER_EVENTS.CONNECTED, connectedListener);
        web3Auth.off(ADAPTER_EVENTS.DISCONNECTED, disconnectedListener);
        web3Auth.off(ADAPTER_EVENTS.CONNECTING, connectingListener);
        web3Auth.off(ADAPTER_EVENTS.ERRORED, errorListener);
      }
    };
  }, [web3Auth]);

  const value = useMemo(() => {
    return {
      web3Auth,
      isConnected,
      isInitialized,
      provider,
      userInfo,
      isMFAEnabled,
      status,
      connect,
      enableMFA,
      logout,
      addAndSwitchChain,
      addChain,
      addPlugin,
      authenticateUser,
      switchChain,
      getPlugin,
      isInitializing,
      isConnecting,
      initError,
      connectError,
    };
  }, [
    web3Auth,
    isConnected,
    isInitialized,
    provider,
    userInfo,
    isMFAEnabled,
    status,
    getPlugin,
    connect,
    enableMFA,
    logout,
    addAndSwitchChain,
    addChain,
    addPlugin,
    authenticateUser,
    switchChain,
    isInitializing,
    isConnecting,
    initError,
    connectError,
  ]);

  return createElement(Web3AuthInnerContext.Provider, { value }, children);
}
