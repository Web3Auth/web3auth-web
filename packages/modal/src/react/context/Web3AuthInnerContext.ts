import {
  CONNECTED_EVENT_DATA,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  type IProvider,
  WalletInitializationError,
} from "@web3auth/no-modal";
import { createContext, createElement, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";

import { Web3Auth } from "../../modalManager";
import { IWeb3AuthInnerContext, Web3AuthProviderProps } from "../interfaces";

export const Web3AuthInnerContext = createContext<IWeb3AuthInnerContext>(null);

export function Web3AuthInnerProvider(params: PropsWithChildren<Web3AuthProviderProps>) {
  const { children, config } = params;
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);

  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [status, setStatus] = useState<CONNECTOR_STATUS_TYPE | null>(null);

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
      setIsAuthenticated(false);
      setStatus(null);
    };

    resetHookState();
    const { web3AuthOptions } = config;
    const web3AuthInstance = new Web3Auth(web3AuthOptions);
    setWeb3Auth(web3AuthInstance);
  }, [config]);

  useEffect(() => {
    const controller = new AbortController();
    async function init() {
      try {
        setInitError(null);
        setIsInitializing(true);
        await web3Auth.initModal({ signal: controller.signal });
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
  }, [web3Auth, config]);

  useEffect(() => {
    const notReadyListener = () => setStatus(web3Auth.status);
    const readyListener = () => {
      setStatus(web3Auth.status);
      setIsInitialized(true);
    };
    const connectedListener = (data: CONNECTED_EVENT_DATA) => {
      setStatus(web3Auth.status);
      // we do this because of rehydration issues. status connected is fired first but web3auth sdk is not ready yet.
      if (web3Auth.status === CONNECTOR_STATUS.CONNECTED) {
        setIsInitialized(true);
        setIsAuthenticated(true);
        setProvider(data.provider);
      }
    };
    const disconnectedListener = () => {
      setStatus(web3Auth.status);
      setIsAuthenticated(false);
      setProvider(null);
    };
    const connectingListener = () => {
      setStatus(web3Auth.status);
    };
    const errorListener = () => {
      setStatus(CONNECTOR_STATUS.ERRORED);
    };
    if (web3Auth) {
      // web3Auth is initialized here.
      setStatus(web3Auth.status);
      web3Auth.on(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
      web3Auth.on(CONNECTOR_EVENTS.READY, readyListener);
      web3Auth.on(CONNECTOR_EVENTS.CONNECTED, connectedListener);
      web3Auth.on(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
      web3Auth.on(CONNECTOR_EVENTS.CONNECTING, connectingListener);
      web3Auth.on(CONNECTOR_EVENTS.ERRORED, errorListener);
    }

    return () => {
      if (web3Auth) {
        web3Auth.off(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
        web3Auth.off(CONNECTOR_EVENTS.READY, readyListener);
        web3Auth.off(CONNECTOR_EVENTS.CONNECTED, connectedListener);
        web3Auth.off(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
        web3Auth.off(CONNECTOR_EVENTS.CONNECTING, connectingListener);
        web3Auth.off(CONNECTOR_EVENTS.ERRORED, errorListener);

        web3Auth.cleanup();
      }
    };
  }, [web3Auth]);

  const value = useMemo(() => {
    return {
      web3Auth,
      isAuthenticated,
      isInitialized,
      provider,
      status,
      isInitializing,
      initError,
      getPlugin,
    };
  }, [web3Auth, isAuthenticated, isInitialized, provider, status, getPlugin, isInitializing, initError]);

  return createElement(Web3AuthInnerContext.Provider, { value }, children);
}
