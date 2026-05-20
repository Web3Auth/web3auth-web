import { Ref, ShallowRef } from "vue";

import type { ChainNamespaceType, Connection, CONNECTOR_STATUS_TYPE, IPlugin, IWeb3AuthCoreOptions } from "../base";
import type { Web3AuthNoModal } from "../noModal";
import { WalletServicesPluginType } from "../plugins/wallet-services-plugin";

export type Web3AuthContextConfig = {
  web3AuthOptions: IWeb3AuthCoreOptions;
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

interface IBaseWeb3AuthComposableContext {
  isConnected: Ref<boolean>;
  isAuthorized: Ref<boolean>;
  connection: Ref<Connection | null>;
  isInitializing: Ref<boolean>;
  initError: Ref<Error | null>;
  isInitialized: Ref<boolean>;
  status: Ref<CONNECTOR_STATUS_TYPE | null>;
  isMFAEnabled: Ref<boolean>;
  /**
   * Get Provider State Syncing status for the primary connector.
   * On init or after chain namespace change, the provider state might not be ready yet, with the accounts still loading.
   * During this time, the provider state syncing status will be true.
   */
  isProviderStateSyncing: Ref<boolean>;
  /**
   * Get Account Ready status for the primary connector.
   * On init or after chain namespace change, the accounts might not be ready yet, with the accounts still loading.
   * After the accounts are loaded, the account ready status will be true.
   */
  isAccountReady: Ref<boolean>;
  chainId: Ref<string | null>;
  chainNamespace: Ref<ChainNamespaceType | null>;
  getPlugin: (pluginName: string) => IPlugin | null;
  setIsMFAEnabled: (isMfaEnabled: boolean) => void;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthComposableContext {
  web3Auth: ShallowRef<Web3AuthNoModal | null>;
}

export interface IWalletServicesInnerContext {
  plugin: ShallowRef<WalletServicesPluginType | null>;
  ready: Ref<boolean>;
  connecting: Ref<boolean>;
}
