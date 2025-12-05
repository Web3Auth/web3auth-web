import { createContext, createElement, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";

import {
  ANALYTICS_INTEGRATION_TYPE,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  IProvider,
  WalletInitializationError,
} from "../../base";
import { Web3AuthNoModal } from "../../noModal";
import { IWeb3AuthInnerContext, Web3AuthProviderProps } from "../interfaces";

export const Web3AuthInnerContext = createContext<IWeb3AuthInnerContext>(null);

export function Web3AuthInnerProvider(params: PropsWithChildren<Web3AuthProviderProps>) {
  const { children, config, initialState } = params;
  const { web3AuthOptions } = config;

  const web3Auth = useMemo(() => {
    setProvider(null);

    return new Web3AuthNoModal(web3AuthOptions, initialState);
  }, [web3AuthOptions, initialState]);

  const [chainId, setChainId] = useState<string | null>(null);
  const [chainNamespace, setChainNamespace] = useState<ChainNamespaceType | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [status, setStatus] = useState<CONNECTOR_STATUS_TYPE | null>(null);
  const [isMFAEnabled, setIsMFAEnabled] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  const getPlugin = useCallback(
    (name: string) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      return web3Auth.getPlugin(name);
    },
    [web3Auth]
  );

  useEffect(() => {
    const controller = new AbortController();
    async function init() {
      try {
        setInitError(null);
        setIsInitializing(true);
        web3Auth.setAnalyticsProperties({
          integration_type: ANALYTICS_INTEGRATION_TYPE.REACT_HOOKS,
        });
        await web3Auth.init({ signal: controller.signal });
        setChainId(web3Auth.currentChainId);
        setChainNamespace(web3Auth.currentChain?.chainNamespace);
      } catch (error) {
        setInitError(error as Error);
      } finally {
        setIsInitializing(false);
      }
    }

    if (web3Auth) init();

    return () => {
      controller.abort();
    };
  }, [web3Auth]);

  useEffect(() => {
    const handleChainChange = async (chainId: string) => {
      setChainId(chainId);
      setChainNamespace(web3Auth?.currentChain?.chainNamespace);
    };

    if (provider) {
      provider.on("chainChanged", handleChainChange);
      return () => {
        if (provider) {
          provider.off("chainChanged", handleChainChange);
        }
      };
    }
  }, [web3Auth, provider]);

  useEffect(() => {
    const notReadyListener = () => setStatus(CONNECTOR_STATUS.NOT_READY);
    const readyListener = () => {
      setStatus(web3Auth.status);
      setIsInitialized(true);
    };
    const connectedListener = (data: CONNECTED_EVENT_DATA) => {
      setStatus(web3Auth.status);
      // we do this because of rehydration issues. status connected is fired first but web3auth sdk is not ready yet.
      if (web3Auth.status === CONNECTOR_STATUS.CONNECTED) {
        setIsInitialized(true);
        setIsConnected(true);
        setProvider(data.provider);
      }
    };
    const disconnectedListener = () => {
      setStatus(web3Auth.status);
      setIsConnected(false);
      setIsAuthorized(false);
      setProvider(null);
    };

    const connectingListener = () => {
      setStatus(web3Auth.status);
    };
    const errorListener = () => {
      setStatus(web3Auth.status);
    };
    const rehydrationErrorListener = () => {
      setStatus(web3Auth.status);
      setIsConnected(false);
      setIsAuthorized(false);
      setProvider(null);
    };

    const authorizedListener = () => {
      setStatus(web3Auth.status);
      if (web3Auth.status === CONNECTOR_STATUS.AUTHORIZED) {
        setIsConnected(true);
        setIsAuthorized(true);
      }
    };

    const mfaEnabledListener = (isMFAEnabled: boolean) => {
      if (typeof isMFAEnabled === "boolean") setIsMFAEnabled(isMFAEnabled);
    };

    // TODO: In strict mode, web3auth becomes null and .off throws an error sometimes.
    if (web3Auth) {
      // web3Auth is initialized here.
      setStatus(web3Auth.status);
      web3Auth.on(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
      web3Auth.on(CONNECTOR_EVENTS.READY, readyListener);
      web3Auth.on(CONNECTOR_EVENTS.CONNECTED, connectedListener);
      web3Auth.on(CONNECTOR_EVENTS.AUTHORIZED, authorizedListener);
      web3Auth.on(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
      web3Auth.on(CONNECTOR_EVENTS.CONNECTING, connectingListener);
      web3Auth.on(CONNECTOR_EVENTS.ERRORED, errorListener);
      web3Auth.on(CONNECTOR_EVENTS.REHYDRATION_ERROR, rehydrationErrorListener);
      web3Auth.on(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);
    }

    return () => {
      if (web3Auth) {
        web3Auth.off(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
        web3Auth.off(CONNECTOR_EVENTS.READY, readyListener);
        web3Auth.off(CONNECTOR_EVENTS.CONNECTED, connectedListener);
        web3Auth.off(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
        web3Auth.off(CONNECTOR_EVENTS.CONNECTING, connectingListener);
        web3Auth.off(CONNECTOR_EVENTS.ERRORED, errorListener);
        web3Auth.off(CONNECTOR_EVENTS.REHYDRATION_ERROR, rehydrationErrorListener);
        web3Auth.off(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);
        web3Auth.off(CONNECTOR_EVENTS.AUTHORIZED, authorizedListener);
      }
    };
  }, [web3Auth]);

  const value = useMemo(() => {
    return {
      web3Auth,
      isConnected,
      isInitialized,
      provider,
      status,
      isInitializing,
      initError,
      isMFAEnabled,
      chainId,
      chainNamespace,
      getPlugin,
      setIsMFAEnabled,
      isAuthorized,
    };
  }, [
    web3Auth,
    isConnected,
    isInitialized,
    provider,
    status,
    getPlugin,
    isInitializing,
    initError,
    isMFAEnabled,
    setIsMFAEnabled,
    chainId,
    chainNamespace,
    isAuthorized,
  ]);

  return createElement(Web3AuthInnerContext.Provider, { value }, children);
}
