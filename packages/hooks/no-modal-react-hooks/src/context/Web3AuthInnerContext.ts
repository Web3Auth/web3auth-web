import type { AuthUserInfo, LoginParams } from "@web3auth/auth-adapter";
import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  CustomChainConfig,
  type IPlugin,
  IProvider,
  WALLET_ADAPTER_TYPE,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { createContext, createElement, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";

import { IWeb3AuthInnerContext, Web3AuthProviderProps } from "../interfaces";

export const Web3AuthInnerContext = createContext<IWeb3AuthInnerContext>(null);

export function Web3AuthInnerProvider(params: PropsWithChildren<Web3AuthProviderProps>) {
  const { children, config } = params;
  const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal | null>(null);

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
    const web3Instance = new Web3AuthNoModal(web3AuthOptions);
    if (adapters.length) adapters.map((adapter) => web3Instance.configureAdapter(adapter));
    if (plugins.length)
      plugins.forEach((plugin) => {
        web3Instance.addPlugin(plugin);
      });
    setWeb3Auth(web3Instance);
  }, [config]);

  useEffect(() => {
    async function init() {
      try {
        setInitError(null);
        setIsInitializing(true);
        await web3Auth.init();
      } catch (error) {
        setInitError(error as Error);
      } finally {
        setIsInitializing(false);
      }
    }

    if (web3Auth) init();
  }, [web3Auth]);

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

  // TODO: don't throw error in init, connect in v9

  useEffect(() => {
    const notReadyListener = () => setStatus(ADAPTER_STATUS.NOT_READY);
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

  const manageMFA = useCallback(
    async (loginParams: Partial<LoginParams>) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      if (!isConnected) throw WalletLoginError.notConnectedError();
      await web3Auth.manageMFA(loginParams);
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

  const connectTo = useCallback(
    async <T>(walletName: WALLET_ADAPTER_TYPE, loginParams?: T) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      try {
        setConnectError(null);
        setIsConnecting(true);
        const localProvider = await web3Auth.connectTo(walletName, loginParams);
        return localProvider;
      } catch (error) {
        setConnectError(error as Error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [web3Auth]
  );

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

  const value = useMemo(() => {
    return {
      web3Auth,
      isConnected,
      isInitialized,
      provider,
      userInfo,
      isMFAEnabled,
      status,
      getPlugin,
      connectTo,
      enableMFA,
      manageMFA,
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
    };
  }, [
    web3Auth,
    isConnected,
    isInitialized,
    provider,
    userInfo,
    isMFAEnabled,
    status,
    connectTo,
    getPlugin,
    enableMFA,
    manageMFA,
    logout,
    addAndSwitchChain,
    addChain,
    addPlugin,
    authenticateUser,
    switchChain,
    isConnecting,
    isInitializing,
    initError,
    connectError,
  ]);

  return createElement(Web3AuthInnerContext.Provider, { value }, children);
}
