import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ANALYTICS_INTEGRATION_TYPE,
  type ChainNamespaceType,
  type CONNECTED_EVENT_DATA,
  type Connection,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  IWeb3Auth,
  type IWeb3AuthState,
  LOGIN_MODE,
  WalletInitializationError,
} from "../../base";

export type IWeb3AuthInnerContextValue<TWeb3Auth extends IWeb3Auth> = {
  web3Auth: TWeb3Auth;
  isConnected: boolean;
  isInitialized: boolean;
  connection: Connection | null;
  status: CONNECTOR_STATUS_TYPE | null;
  isInitializing: boolean;
  initError: Error | null;
  isMFAEnabled: boolean;
  chainId: string | null;
  chainNamespace: ChainNamespaceType | null;
  getPlugin: TWeb3Auth["getPlugin"];
  setIsMFAEnabled: (isMFAEnabled: boolean) => void;
  isAuthorized: boolean;
};

type UseWeb3AuthInnerContextValueOptions<TWeb3Auth extends IWeb3Auth, TWeb3AuthOptions> = {
  Web3AuthConstructor: new (options: TWeb3AuthOptions, initialState?: Partial<IWeb3AuthState>) => TWeb3Auth;
  web3AuthOptions: TWeb3AuthOptions;
  initialState?: Partial<IWeb3AuthState>;
  notReadyUsesCurrentStatus?: boolean;
  cleanupOnUnmount?: boolean;
  initEffectDependency?: unknown;
};

type InitialWeb3AuthState = {
  chainId: string | null;
  chainNamespace: ChainNamespaceType | null;
  connection: Connection | null;
  isAuthorized: boolean;
  isConnected: boolean;
  isInitialized: boolean;
  status: CONNECTOR_STATUS_TYPE | null;
};

function getInitialState(web3Auth: IWeb3Auth): InitialWeb3AuthState {
  const isConnected = web3Auth.status === CONNECTOR_STATUS.CONNECTED || web3Auth.status === CONNECTOR_STATUS.AUTHORIZED;
  const isAuthorized = web3Auth.status === CONNECTOR_STATUS.AUTHORIZED;

  return {
    chainId: isConnected ? web3Auth.currentChainId : null,
    chainNamespace: isConnected ? (web3Auth.currentChain?.chainNamespace ?? null) : null,
    connection: isConnected ? web3Auth.connection : null,
    isAuthorized,
    isConnected,
    isInitialized: isConnected,
    status: web3Auth.status,
  };
}

export function useWeb3AuthInnerContextValue<TWeb3Auth extends IWeb3Auth, TWeb3AuthOptions>({
  Web3AuthConstructor,
  web3AuthOptions,
  initialState,
  notReadyUsesCurrentStatus = false,
  cleanupOnUnmount = false,
  initEffectDependency,
}: UseWeb3AuthInnerContextValueOptions<TWeb3Auth, TWeb3AuthOptions>): IWeb3AuthInnerContextValue<TWeb3Auth> {
  const web3Auth = useMemo(() => {
    return new Web3AuthConstructor(web3AuthOptions, initialState);
  }, [Web3AuthConstructor, web3AuthOptions, initialState]);
  const initialWeb3AuthState = getInitialState(web3Auth);
  const [chainId, setChainId] = useState<string | null>(() => initialWeb3AuthState.chainId);
  const [chainNamespace, setChainNamespace] = useState<ChainNamespaceType | null>(() => initialWeb3AuthState.chainNamespace);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [connection, setConnection] = useState<Connection | null>(() => initialWeb3AuthState.connection);
  const [isInitialized, setIsInitialized] = useState<boolean>(initialWeb3AuthState.isInitialized);
  const [isMFAEnabled, setIsMFAEnabled] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(initialWeb3AuthState.isConnected);
  const [status, setStatus] = useState<CONNECTOR_STATUS_TYPE | null>(initialWeb3AuthState.status);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(initialWeb3AuthState.isAuthorized);

  const getPlugin = useCallback(
    ((name: string) => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      return web3Auth.getPlugin(name);
    }) as TWeb3Auth["getPlugin"],
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

    init();

    return () => {
      controller.abort();
    };
  }, [web3Auth, initEffectDependency]);

  useEffect(() => {
    const handleChainChange = async (nextChainId: string) => {
      setChainId(nextChainId);
      setChainNamespace(web3Auth.currentChain?.chainNamespace);
    };

    const provider = connection?.ethereumProvider ?? null;
    if (!provider) return undefined;

    provider.on("chainChanged", handleChainChange);
    return () => {
      provider.removeListener("chainChanged", handleChainChange);
    };
  }, [web3Auth.currentChain, connection?.ethereumProvider]);

  useEffect(() => {
    const notReadyListener = () => {
      setStatus(notReadyUsesCurrentStatus ? web3Auth.status : CONNECTOR_STATUS.NOT_READY);
    };
    const readyListener = () => {
      setStatus(web3Auth.status);
      setIsInitialized(true);
    };
    const connectedListener = (data: CONNECTED_EVENT_DATA) => {
      if (data.pendingUserConsent) return;
      setStatus(web3Auth.status);
      // we do this because of rehydration issues. status connected is fired first but web3auth sdk is not ready yet.
      if (web3Auth.status === CONNECTOR_STATUS.CONNECTED) {
        setIsInitialized(true);
        setIsConnected(true);
        setConnection(web3Auth.connection);
        setChainId(web3Auth.currentChainId);
        setChainNamespace(web3Auth.currentChain?.chainNamespace ?? null);
      }
    };
    const disconnectedListener = () => {
      setStatus(web3Auth.status);
      setIsConnected(false);
      setIsAuthorized(false);
      setConnection(null);
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
      setConnection(null);
    };
    const authorizedListener = () => {
      setStatus(web3Auth.status);
      if (web3Auth.status === CONNECTOR_STATUS.AUTHORIZED) {
        setIsConnected(true);
        setIsAuthorized(true);
      }
    };
    const consentAcceptedListener = () => {
      setStatus(web3Auth.status);
      if (web3Auth.status === CONNECTOR_STATUS.CONNECTED || web3Auth.status === CONNECTOR_STATUS.AUTHORIZED) {
        setIsInitialized(true);
        setIsConnected(true);
        setConnection(web3Auth.connection);
        setChainId(web3Auth.currentChainId);
        setChainNamespace(web3Auth.currentChain?.chainNamespace ?? null);
        if (web3Auth.status === CONNECTOR_STATUS.AUTHORIZED) {
          setIsAuthorized(true);
        }
      }
    };
    const mfaEnabledListener = (nextIsMFAEnabled: boolean) => {
      if (typeof nextIsMFAEnabled === "boolean") setIsMFAEnabled(nextIsMFAEnabled);
    };
    if (web3Auth) {
      web3Auth.on(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
      web3Auth.on(CONNECTOR_EVENTS.READY, readyListener);
      web3Auth.on(CONNECTOR_EVENTS.CONNECTED, connectedListener);
      web3Auth.on(CONNECTOR_EVENTS.AUTHORIZED, authorizedListener);
      web3Auth.on(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
      web3Auth.on(CONNECTOR_EVENTS.CONNECTING, connectingListener);
      web3Auth.on(CONNECTOR_EVENTS.ERRORED, errorListener);
      web3Auth.on(CONNECTOR_EVENTS.REHYDRATION_ERROR, rehydrationErrorListener);
      web3Auth.on(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);

      if (web3Auth.loginMode === LOGIN_MODE.MODAL) {
        web3Auth.on(CONNECTOR_EVENTS.CONSENT_ACCEPTED, consentAcceptedListener);
      }
    }
    return () => {
      if (!web3Auth) return;
      web3Auth.removeListener(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
      web3Auth.removeListener(CONNECTOR_EVENTS.READY, readyListener);
      web3Auth.removeListener(CONNECTOR_EVENTS.CONNECTED, connectedListener);
      web3Auth.removeListener(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
      web3Auth.removeListener(CONNECTOR_EVENTS.CONNECTING, connectingListener);
      web3Auth.removeListener(CONNECTOR_EVENTS.ERRORED, errorListener);
      web3Auth.removeListener(CONNECTOR_EVENTS.REHYDRATION_ERROR, rehydrationErrorListener);
      web3Auth.removeListener(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);
      web3Auth.removeListener(CONNECTOR_EVENTS.AUTHORIZED, authorizedListener);

      if (web3Auth.loginMode === LOGIN_MODE.MODAL) {
        web3Auth.removeListener(CONNECTOR_EVENTS.CONSENT_ACCEPTED, consentAcceptedListener);
      }

      if (cleanupOnUnmount) {
        web3Auth.cleanup();
      }
    };
  }, [cleanupOnUnmount, notReadyUsesCurrentStatus, web3Auth]);

  return useMemo(() => {
    return {
      web3Auth,
      isConnected,
      isInitialized,
      connection,
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
    connection,
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
}
