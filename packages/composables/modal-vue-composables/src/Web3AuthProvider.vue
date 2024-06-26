<script setup lang="ts">
import { ref, provide, watch, shallowRef } from "vue";
import type { ADAPTER_STATUS_TYPE, IProvider, IPlugin, CustomChainConfig, IAdapter } from "@web3auth/base";
import { ADAPTER_EVENTS, WalletInitializationError, WalletLoginError } from "@web3auth/base";
import { Web3Auth, type ModalConfig, type Web3AuthOptions } from "@web3auth/modal";
import type { OpenloginUserInfo, LoginParams } from "@web3auth/openlogin-adapter";

// TODO: move to interfaces
type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

const props = defineProps<{ config: Web3AuthContextConfig }>();

// TODO: should it be a shallowRef?
const web3Auth = shallowRef<Web3Auth | null>(null);
const isConnected = ref(false);
const provider = ref<IProvider | null>(null);
const userInfo = ref<Partial<OpenloginUserInfo> | null>(null);
const isMFAEnabled = ref(false);
const isInitialized = ref(false);
const status = ref<ADAPTER_STATUS_TYPE | null>(null);

const addPlugin = (plugin: IPlugin) => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  return web3Auth.value.addPlugin(plugin);
};

const getPlugin = (name: string) => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  return web3Auth.value.getPlugin(name);
};

const initModal = async (modalParams: { modalConfig?: Record<string, ModalConfig> } = {}) => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  await web3Auth.value.initModal(modalParams);
};

const enableMFA = async (loginParams: Partial<LoginParams>) => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  if (!isConnected.value) throw WalletLoginError.notConnectedError();
  await web3Auth.value.enableMFA(loginParams);
  const localUserInfo = await web3Auth.value.getUserInfo();
  userInfo.value = localUserInfo;
  isMFAEnabled.value = localUserInfo.isMfaEnabled || false;
};

const logout = async (logoutParams: { cleanup: boolean } = { cleanup: false }) => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  if (!isConnected.value) throw WalletLoginError.notConnectedError();

  await web3Auth.value.logout(logoutParams);
};

const connect = async () => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  const localProvider = await web3Auth.value.connect();
  return localProvider;
};

const addAndSwitchChain = async (chainConfig: CustomChainConfig) => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  await web3Auth.value.addChain(chainConfig);
  await web3Auth.value.switchChain({ chainId: chainConfig.chainId });
};

const authenticateUser = async () => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  return web3Auth.value.authenticateUser();
};

const addChain = async (chainConfig: CustomChainConfig) => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  return web3Auth.value.addChain(chainConfig);
};

const switchChain = (chainParams: { chainId: string }) => {
  if (!web3Auth.value) throw WalletInitializationError.notReady();
  return web3Auth.value.switchChain(chainParams);
};

watch(
  [web3Auth, () => props.config],
  () => {
    if (web3Auth.value) return;

    const resetHookState = () => {
      provider.value = null;
      userInfo.value = null;
      isMFAEnabled.value = false;
      isConnected.value = false;
      status.value = null;
    };

    resetHookState();
    const { web3AuthOptions, adapters = [], plugins = [] } = props.config;
    const web3AuthInstance = new Web3Auth(web3AuthOptions);
    if (adapters.length) adapters.map((adapter) => web3AuthInstance.configureAdapter(adapter));
    if (plugins.length) {
      plugins.forEach((plugin) => {
        web3AuthInstance.addPlugin(plugin);
      });
    }

    web3Auth.value = web3AuthInstance;
  },
  { immediate: true }
);

watch([web3Auth, isConnected], () => {
  if (web3Auth.value) {
    const addState = async (web3Auth: Web3Auth) => {
      console.log("addingState");
      provider.value = web3Auth.provider;
      const userState = await web3Auth.getUserInfo();
      userInfo.value = userState;
      isMFAEnabled.value = userState?.isMfaEnabled || false;
    };

    const resetState = () => {
      provider.value = null;
      userInfo.value = null;
      isMFAEnabled.value = false;
    };

    if (isConnected.value) addState(web3Auth.value as Web3Auth);
    else resetState();
  }
});

watch(
  web3Auth,
  () => {
    if (web3Auth.value) {
      const notReadyListener = () => (status.value = web3Auth.value.status);
      const readyListener = () => {
        status.value = web3Auth.value.status;
        console.log("readyListener", web3Auth.value.status);
        isInitialized.value = true;
      };
      const connectedListener = () => {
        status.value = web3Auth.value.status;
        isInitialized.value = true;
        isConnected.value = true;
      };
      const disconnectedListener = () => {
        status.value = web3Auth.value.status;
        isConnected.value = false;
      };
      const connectingListener = () => {
        status.value = web3Auth.value.status;
      };
      const errorListener = () => {
        status.value = ADAPTER_EVENTS.ERRORED;
      };

      status.value = web3Auth.value.status;
      // web3Auth is initialized here.
      web3Auth.value.on(ADAPTER_EVENTS.NOT_READY, notReadyListener);
      web3Auth.value.on(ADAPTER_EVENTS.READY, readyListener);
      web3Auth.value.on(ADAPTER_EVENTS.CONNECTED, connectedListener);
      web3Auth.value.on(ADAPTER_EVENTS.DISCONNECTED, disconnectedListener);
      web3Auth.value.on(ADAPTER_EVENTS.CONNECTING, connectingListener);
      web3Auth.value.on(ADAPTER_EVENTS.ERRORED, errorListener);
    }
  },
  { immediate: true }
);

// TODO: type with IWeb3AuthContext
provide("web3AuthContext", {
  web3Auth,
  isConnected,
  isInitialized,
  provider,
  userInfo,
  isMFAEnabled,
  status,
  getPlugin,
  initModal,
  connect,
  enableMFA,
  logout,
  addAndSwitchChain,
  addChain,
  addPlugin,
  authenticateUser,
  switchChain,
});
</script>

<template>
  <slot />
</template>
