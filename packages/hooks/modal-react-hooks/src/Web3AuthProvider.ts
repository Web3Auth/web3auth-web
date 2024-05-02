import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  CustomChainConfig,
  type IAdapter,
  type IPlugin,
  IProvider,
  PLUGIN_EVENTS,
  WalletInitializationError,
  WalletLoginError,
  WalletServicesPluginError,
} from "@web3auth/base";
import { ModalConfig, Web3Auth, type Web3AuthOptions } from "@web3auth/modal";
import type { LoginParams, OpenloginUserInfo } from "@web3auth/openlogin-adapter";
import type { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { createContext, createElement, PropsWithChildren, useCallback, useEffect, useState } from "react";

import { IContext } from "./interfaces";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export const Web3AuthContext = createContext<IContext>(null);

interface web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

const WALLET_SERVICES_PLUGIN_NAME = "WALLET_SERVICES_PLUGIN";

export function Web3AuthProvider(params: PropsWithChildren<web3AuthProviderProps>) {
  const { children, config } = params;
  const [web3Auth, setweb3auth] = useState<Web3Auth | null>(null);

  const [isConnected, setConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [userInfo, setUserInfo] = useState<Partial<OpenloginUserInfo> | null>(null);
  const [isMFAEnabled, setIsMFAEnabled] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [status, setStatus] = useState<ADAPTER_STATUS_TYPE | null>(null);

  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  const [walletSvcConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (walletServicesPlugin) {
      walletServicesPlugin.on(PLUGIN_EVENTS.CONNECTED, () => {
        setIsConnected(true);
      });
      walletServicesPlugin.on(PLUGIN_EVENTS.DISCONNECTED, () => {
        setIsConnected(false);
      });
    }
  }, [walletServicesPlugin]);

  const addPlugin = useCallback(
    (plugin: IPlugin) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      if (plugin.name === WALLET_SERVICES_PLUGIN_NAME) setWalletServicesPlugin(plugin as WalletServicesPlugin);
      return web3Auth.addPlugin(plugin);
    },
    [web3Auth]
  );

  useEffect(() => {
    const { web3AuthOptions, adapters = [], plugins = [] } = config;
    const web3Instance = new Web3Auth(web3AuthOptions);
    if (adapters.length) adapters.map((adapter) => web3Instance.configureAdapter(adapter));
    if (plugins.length)
      plugins.forEach((plugin) => {
        web3Instance.addPlugin(plugin);
        if (plugin.name === WALLET_SERVICES_PLUGIN_NAME) setWalletServicesPlugin(plugin as WalletServicesPlugin);
      });
    setweb3auth(web3Instance);
  }, [config]);

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
    if (status) {
      setIsInitialized(status !== ADAPTER_EVENTS.NOT_READY);
    }
  }, [status]);

  const initModal = useCallback(
    async (modalParams: { modalConfig?: Record<string, ModalConfig> } = {}) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      await web3Auth.initModal(modalParams);
      setStatus(web3Auth.status);
    },
    [web3Auth]
  );

  useEffect(() => {
    if (web3Auth) {
      // web3Auth is initialized here.
      setStatus(web3Auth.status);
      web3Auth.on(ADAPTER_EVENTS.NOT_READY, () => setStatus(ADAPTER_STATUS.NOT_READY));
      web3Auth.on(ADAPTER_EVENTS.CONNECTED, () => {
        setStatus(web3Auth.status);
        setConnected(true);
      });
      web3Auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        setStatus(web3Auth.status);
        setConnected(false);
      });
      web3Auth.on(ADAPTER_EVENTS.CONNECTING, () => setStatus(web3Auth.status));
      web3Auth.on(ADAPTER_EVENTS.ERRORED, () => setStatus(ADAPTER_STATUS.ERRORED));
    }
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
    const localProvider = await web3Auth.connect();
    return localProvider;
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

  const showWalletConnectScanner = useCallback(async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showWalletConnectScanner();
  }, [walletServicesPlugin, isConnected]);

  const showWalletUI = useCallback(async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showWalletUi();
  }, [walletServicesPlugin, isConnected]);

  const showCheckout = useCallback(async () => {
    if (!walletServicesPlugin) throw WalletServicesPluginError.notInitialized();
    if (!isConnected) throw WalletServicesPluginError.web3AuthNotConnected();

    return walletServicesPlugin.showCheckout();
  }, [walletServicesPlugin, isConnected]);

  const props = {
    value: {
      core: {
        web3Auth,
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
      },
      walletServices: {
        plugin: walletServicesPlugin,
        isConnected: walletSvcConnected,
        showWalletConnectScanner,
        showCheckout,
        showWalletUI,
      },
    },
  };
  return createElement(Web3AuthContext.Provider, props, children);
}
