import {
  type AuthUserInfo,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  type IProvider,
  type LoginParams,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthContextKey,
} from "@web3auth/no-modal";
import { defineComponent, h, PropType, provide, ref, shallowRef, watch } from "vue";

import { Web3Auth } from "../modalManager";
import { IWeb3AuthContext, Web3AuthContextConfig } from "./interfaces";

export const Web3AuthProvider = defineComponent({
  name: "Web3AuthProvider",
  props: { config: { type: Object as PropType<Web3AuthContextConfig>, required: true } },
  setup(props) {
    const web3Auth = shallowRef<Web3Auth | null>(null);
    const provider = ref<IProvider | null>(null);
    const userInfo = ref<Partial<AuthUserInfo> | null>(null);
    const isMFAEnabled = ref(false);
    const status = ref<CONNECTOR_STATUS_TYPE | null>(null);

    const isInitializing = ref(false);
    const initError = ref<Error | null>(null);
    const isInitialized = ref(false);

    const isConnecting = ref(false);
    const connectError = ref<Error | null>(null);
    const isConnected = ref(false);

    const getPlugin = (name: string) => {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      return web3Auth.value.getPlugin(name);
    };

    const enableMFA = async (loginParams?: Partial<LoginParams>) => {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      if (!isConnected.value) throw WalletLoginError.notConnectedError();
      await web3Auth.value.enableMFA(loginParams);
      const localUserInfo = await web3Auth.value.getUserInfo();
      userInfo.value = localUserInfo;
      isMFAEnabled.value = localUserInfo.isMfaEnabled || false;
    };

    const manageMFA = async (loginParams?: Partial<LoginParams>) => {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      if (!isConnected.value) throw WalletLoginError.notConnectedError();
      await web3Auth.value.manageMFA(loginParams);
    };

    const logout = async (logoutParams: { cleanup: boolean } = { cleanup: false }) => {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      if (!isConnected.value) throw WalletLoginError.notConnectedError();
      await web3Auth.value.logout(logoutParams);
    };

    const connect = async () => {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      try {
        connectError.value = null;
        isConnecting.value = true;
        const localProvider = await web3Auth.value.connect();
        return localProvider;
      } catch (error) {
        connectError.value = error as Error;
        return null;
      } finally {
        isConnecting.value = false;
      }
    };

    const authenticateUser = async () => {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      return web3Auth.value.authenticateUser();
    };

    const switchChain = (chainParams: { chainId: string }) => {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      return web3Auth.value.switchChain(chainParams);
    };

    watch(
      () => props.config,
      (newConfig, _, onInvalidate) => {
        const resetHookState = () => {
          provider.value = null;
          userInfo.value = null;
          isMFAEnabled.value = false;
          isConnected.value = false;
          status.value = null;
        };

        onInvalidate(() => {
          if (web3Auth.value) {
            web3Auth.value.cleanup();
          }
        });

        resetHookState();
        const { web3AuthOptions } = newConfig;
        const web3AuthInstance = new Web3Auth(web3AuthOptions);
        web3Auth.value = web3AuthInstance;
      },
      { immediate: true }
    );

    watch(
      web3Auth,
      async (newWeb3Auth, _, onInvalidate) => {
        const controller = new AbortController();

        // Invalidate the controller here before calling any async methods.
        onInvalidate(() => {
          controller.abort();
        });

        if (newWeb3Auth) {
          try {
            initError.value = null;
            isInitializing.value = true;
            await newWeb3Auth.initModal({ signal: controller.signal });
          } catch (error) {
            initError.value = error as Error;
          } finally {
            isInitializing.value = false;
          }
        }
      },
      { immediate: true }
    );

    watch(isConnected, (newIsConnected) => {
      if (web3Auth.value) {
        const addState = async (web3AuthInstance: Web3Auth) => {
          provider.value = web3AuthInstance.provider;
          const userState = await web3AuthInstance.getUserInfo();
          userInfo.value = userState;
          isMFAEnabled.value = userState?.isMfaEnabled || false;
        };

        const resetState = () => {
          provider.value = null;
          userInfo.value = null;
          isMFAEnabled.value = false;
        };

        if (newIsConnected) addState(web3Auth.value as Web3Auth);
        else resetState();
      }
    });

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
          // we do this because of rehydration issues. status connected is fired first but web3auth sdk is not ready yet.
          if (web3Auth.value!.status === CONNECTOR_STATUS.CONNECTED) {
            isInitialized.value = true;
            isConnected.value = true;
          }
        };
        const disconnectedListener = () => {
          status.value = web3Auth.value!.status;
          isConnected.value = false;
        };
        const connectingListener = () => {
          status.value = web3Auth.value!.status;
        };
        const errorListener = () => {
          status.value = CONNECTOR_EVENTS.ERRORED;
        };

        // unregister previous listeners
        if (prevWeb3Auth && newWeb3Auth !== prevWeb3Auth) {
          prevWeb3Auth.off(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.READY, readyListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.CONNECTED, connectedListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.CONNECTING, connectingListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.ERRORED, errorListener);
        }

        if (newWeb3Auth && newWeb3Auth !== prevWeb3Auth) {
          status.value = newWeb3Auth.status;
          // web3Auth is initialized here.
          newWeb3Auth.on(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
          newWeb3Auth.on(CONNECTOR_EVENTS.READY, readyListener);
          newWeb3Auth.on(CONNECTOR_EVENTS.CONNECTED, connectedListener);
          newWeb3Auth.on(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
          newWeb3Auth.on(CONNECTOR_EVENTS.CONNECTING, connectingListener);
          newWeb3Auth.on(CONNECTOR_EVENTS.ERRORED, errorListener);
        }
      },
      { immediate: true }
    );

    provide<IWeb3AuthContext>(Web3AuthContextKey, {
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
      manageMFA,
      logout,
      authenticateUser,
      switchChain,
      isInitializing,
      isConnecting,
      initError,
      connectError,
    });
  },
  render() {
    return h(this.$slots.default ?? "");
  },
});
