import {
  ANALYTICS_INTEGRATION_TYPE,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  type IProvider,
  WalletInitializationError,
  Web3AuthContextKey,
} from "@web3auth/no-modal";
import { defineComponent, h, PropType, provide, ref, shallowRef, watch } from "vue";

import { Web3Auth } from "../modalManager";
import { IWeb3AuthInnerContext, Web3AuthContextConfig } from "./interfaces";
import { WalletServicesInnerProvider } from "./WalletServicesInnerProvider";

export const Web3AuthProvider = defineComponent({
  name: "Web3AuthProvider",
  props: { config: { type: Object as PropType<Web3AuthContextConfig>, required: true } },
  setup(props) {
    const web3Auth = shallowRef<Web3Auth | null>(null);
    const provider = ref<IProvider | null>(null);
    const isMFAEnabled = ref(false);
    const status = ref<CONNECTOR_STATUS_TYPE | null>(null);

    const isInitializing = ref(false);
    const initError = ref<Error | null>(null);
    const isInitialized = ref(false);

    const isConnected = ref(false);

    const getPlugin = (name: string) => {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      return web3Auth.value.getPlugin(name);
    };

    const setIsMFAEnabled = (isMfaEnabled: boolean) => {
      isMFAEnabled.value = isMfaEnabled;
    };

    watch(
      () => props.config,
      (newConfig, _, onInvalidate) => {
        const resetHookState = () => {
          provider.value = null;
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
        web3AuthInstance.setAnalyticsProperties({ integration_type: ANALYTICS_INTEGRATION_TYPE.VUE_COMPOSABLES });
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
            await newWeb3Auth.init({ signal: controller.signal });
          } catch (error) {
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
          // we do this because of rehydration issues. status connected is fired first but web3auth sdk is not ready yet.
          if (web3Auth.value!.status === CONNECTOR_STATUS.CONNECTED) {
            if (!isInitialized.value) isInitialized.value = true;
            isConnected.value = true;
            provider.value = newWeb3Auth.provider;
          }
        };

        const disconnectedListener = () => {
          status.value = web3Auth.value!.status;
          isConnected.value = false;
          provider.value = null;
          isMFAEnabled.value = false;
        };

        const connectingListener = () => {
          status.value = web3Auth.value!.status;
        };

        const errorListener = () => {
          status.value = web3Auth.value!.status;
          if (isConnected.value) {
            isConnected.value = false;
            provider.value = null;
          }
        };

        const mfaEnabledListener = () => {
          isMFAEnabled.value = true;
        };

        // unregister previous listeners
        if (prevWeb3Auth && newWeb3Auth !== prevWeb3Auth) {
          prevWeb3Auth.off(CONNECTOR_EVENTS.NOT_READY, notReadyListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.READY, readyListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.CONNECTED, connectedListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.DISCONNECTED, disconnectedListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.CONNECTING, connectingListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.ERRORED, errorListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.REHYDRATION_ERROR, errorListener);
          prevWeb3Auth.off(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);
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
          newWeb3Auth.on(CONNECTOR_EVENTS.REHYDRATION_ERROR, errorListener);
          newWeb3Auth.on(CONNECTOR_EVENTS.MFA_ENABLED, mfaEnabledListener);
        }
      },
      { immediate: true }
    );

    provide<IWeb3AuthInnerContext>(Web3AuthContextKey, {
      web3Auth,
      isConnected,
      isInitialized,
      provider,
      status,
      isInitializing,
      initError,
      isMFAEnabled,
      getPlugin,
      setIsMFAEnabled,
    });
  },
  render() {
    return h(WalletServicesInnerProvider, {}, this.$slots.default ?? "");
  },
});
