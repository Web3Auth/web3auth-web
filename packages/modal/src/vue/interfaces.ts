import type { CONNECTOR_STATUS_TYPE, IPlugin, IProvider, WalletServicesPluginType } from "@web3auth/no-modal";
import { Ref, ShallowRef } from "vue";

import type { Web3Auth, Web3AuthOptions } from "../modalManager";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

interface IBaseWeb3AuthComposableContext {
  isConnected: Ref<boolean>;
  isAuthorized: Ref<boolean>;
  provider: Ref<IProvider | null>;
  isInitializing: Ref<boolean>;
  initError: Ref<Error | null>;
  isInitialized: Ref<boolean>;
  status: Ref<CONNECTOR_STATUS_TYPE | null>;
  isMFAEnabled: Ref<boolean>;
  getPlugin: (pluginName: string) => IPlugin | null;
  setIsMFAEnabled: (isMfaEnabled: boolean) => void;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthComposableContext {
  web3Auth: ShallowRef<Web3Auth | null>;
}

export interface IWalletServicesInnerContext {
  plugin: ShallowRef<WalletServicesPluginType | null>;
  ready: Ref<boolean>;
  connecting: Ref<boolean>;
}
