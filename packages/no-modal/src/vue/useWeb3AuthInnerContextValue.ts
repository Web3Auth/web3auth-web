import { type Ref, ref, type ShallowRef, shallowRef, watch } from "vue";

import {
  ANALYTICS_INTEGRATION_TYPE,
  type ChainNamespaceType,
  type Connection,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  type IWeb3Auth,
  log,
  WalletInitializationError,
} from "../base";

export type IWeb3AuthInnerContextValue<TWeb3Auth extends IWeb3Auth> = {
  web3Auth: ShallowRef<TWeb3Auth | null>;
  isConnected: Ref<boolean>;
  isAuthorized: Ref<boolean>;
  connection: Ref<Connection | null>;
  isInitializing: Ref<boolean>;
  initError: Ref<Error | null>;
  isInitialized: Ref<boolean>;
  status: Ref<CONNECTOR_STATUS_TYPE | null>;
  isMFAEnabled: Ref<boolean>;
  chainId: Ref<string | null>;
  chainNamespace: Ref<ChainNamespaceType | null>;
  getPlugin: TWeb3Auth["getPlugin"];
  setIsMFAEnabled: (isMfaEnabled: boolean) => void;
};

type UseWeb3AuthInnerContextValueOptions<TWeb3Auth extends IWeb3Auth, TWatchSource, TWeb3AuthOptions> = {
  Web3AuthConstructor: new (options: TWeb3AuthOptions) => TWeb3Auth;
  watchSource: () => TWatchSource;
  getWeb3AuthOptions: (source: TWatchSource) => TWeb3AuthOptions;
  createConnectionRef?: () => Ref<Connection | null>;
};

export function useWeb3AuthInnerContextValue<TWeb3Auth extends IWeb3Auth, TWatchSource, TWeb3AuthOptions>({
  Web3AuthConstructor,
  watchSource,
  getWeb3AuthOptions,
  createConnectionRef = () => ref<Connection | null>(null),
}: UseWeb3AuthInnerContextValueOptions<TWeb3Auth, TWatchSource, TWeb3AuthOptions>): IWeb3AuthInnerContextValue<TWeb3Auth> {
  const web3Auth = shallowRef<TWeb3Auth | null>(null) as ShallowRef<TWeb3Auth | null>;
  const connection = createConnectionRef();
  const isMFAEnabled = ref(false);
  const status = ref<CONNECTOR_STATUS_TYPE | null>(null);
  const chainId = ref<string | null>(null);
  const chainNamespace = ref<ChainNamespaceType | null>(null);

  const isInitializing = ref(false);
  const initError = ref<Error | null>(null);
  const isInitialized = ref(false);

  const isConnected = ref(false);
  const isAuthorized = ref(false);

  const getPlugin = ((name: string) => {
    if (!web3Auth.value) throw WalletInitializationError.notReady();
    return web3Auth.value.getPlugin(name);
  }) as TWeb3Auth["getPlugin"];

  const setIsMFAEnabled = (isMfaEnabled: boolean) => {
    isMFAEnabled.value = isMfaEnabled;
  };

  watch(
    watchSource,
    (newSource, _, onInvalidate) => {
      const resetHookState = () => {
        connection.value = null;
        isMFAEnabled.value = false;
        isConnected.value = false;
        isAuthorized.value = false;
        status.value = null;
        chainId.value = null;
        chainNamespace.value = null;
      };

      onInvalidate(() => {
        if (web3Auth.value) {
          web3Auth.value.cleanup();
        }
      });

      resetHookState();
      const web3AuthInstance = new Web3AuthConstructor(getWeb3AuthOptions(newSource));
      web3AuthInstance.setAnalyticsProperties({ integration_type: ANALYTICS_INTEGRATION_TYPE.VUE_COMPOSABLES });
      web3Auth.value = web3AuthInstance;
    },
    { immediate: true }
  );

  watch(
    web3Auth,
    async (newWeb3Auth, _, onInvalidate) => {
      const controller = new AbortController();

      onInvalidate(() => {
        controller.abort();
      });

      if (newWeb3Auth) {
        try {
          initError.value = null;
          isInitializing.value = true;
          await newWeb3Auth.init({ signal: controller.signal });
        } catch (error) {
          log.error("Error initializing web3auth", error);
          initError.value = error as Error;
        } finally {
          isInitializing.value = false;
        }
      }
    },
    { immediate: true }
  );

  watch(
    web3Auth,
    (newWeb3Auth, prevWeb3Auth) => {
      const notReadyListener = () => {
        status.value = web3Auth.value!.status;
      };
      const readyListener = () => {
        status.value = web3Auth.value!.status;
        isInitialized.value = true;
      };

      const connectedListener = () => {
        status.value = web3Auth.value!.status;
        // We do this because of rehydration issues. status connected is fired first but web3auth sdk is not ready yet.
        if (web3Auth.value!.status === CONNECTOR_STATUS.CONNECTED) {
          if (!isInitialized.value) isInitialized.value = true;
          isConnected.value = true;
          connection.value = newWeb3Auth.connection;
          chainId.value = web3Auth.value!.currentChainId;
          chainNamespace.value = web3Auth.value!.currentChain?.chainNamespace ?? null;
        }
      };

      const authorizedListener = () => {
        status.value = web3Auth.value!.status;
        if (web3Auth.value!.status === CONNECTOR_STATUS.AUTHORIZED) {
          isAuthorized.value = true;
          isConnected.value = true;
        }
      };

      const disconnectedListener = () => {
        status.value = web3Auth.value!.status;
        isConnected.value = false;
        connection.value = null;
        isMFAEnabled.value = false;
        isAuthorized.value = false;
      };

      const connectingListener = () => {
        status.value = web3Auth.value!.status;
      };

      const errorListener = () => {
        status.value = web3Auth.value!.status;
      };

      const mfaEnabledListener = () => {
        isMFAEnabled.value = true;
      };

      if (prevWeb3Auth && newWeb3Auth !== prevWeb3Auth) {
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.READY, readyListener);
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.CONNECTED, connectedListener);
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.AUTHORIZED, authorizedListener);
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.CONNECTING, connectingListener);
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.ERRORED, errorListener);
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.REHYDRATION_ERROR, errorListener);
        prevWeb3Auth.removeListener(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);
      }

      if (newWeb3Auth && newWeb3Auth !== prevWeb3Auth) {
        status.value = newWeb3Auth.status;
        newWeb3Auth.on(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
        newWeb3Auth.on(CONNECTOR_EVENTS.READY, readyListener);
        newWeb3Auth.on(CONNECTOR_EVENTS.CONNECTED, connectedListener);
        newWeb3Auth.on(CONNECTOR_EVENTS.AUTHORIZED, authorizedListener);
        newWeb3Auth.on(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
        newWeb3Auth.on(CONNECTOR_EVENTS.CONNECTING, connectingListener);
        newWeb3Auth.on(CONNECTOR_EVENTS.ERRORED, errorListener);
        newWeb3Auth.on(CONNECTOR_EVENTS.REHYDRATION_ERROR, errorListener);
        newWeb3Auth.on(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);
      }
    },
    { immediate: true }
  );

  watch(
    connection,
    (newConnection, prevConnection) => {
      const handleChainChange = (newChainId: string) => {
        chainId.value = newChainId;
        chainNamespace.value = web3Auth.value?.currentChain?.chainNamespace ?? null;
      };

      const prevProvider = prevConnection?.ethereumProvider ?? null;
      const newProvider = newConnection?.ethereumProvider ?? null;

      if (prevProvider && newProvider !== prevProvider) {
        prevProvider.removeListener("chainChanged", handleChainChange);
      }

      if (newProvider && newProvider !== prevProvider) {
        newProvider.on("chainChanged", handleChainChange);
      }
    },
    { immediate: true }
  );

  return {
    web3Auth,
    isConnected,
    isAuthorized,
    connection,
    isInitializing,
    initError,
    isInitialized,
    status,
    isMFAEnabled,
    chainId,
    chainNamespace,
    getPlugin,
    setIsMFAEnabled,
  };
}
