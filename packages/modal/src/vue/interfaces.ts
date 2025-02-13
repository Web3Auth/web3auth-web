import type { AuthUserInfo, LoginParams } from "@web3auth/auth";
import type { ADAPTER_STATUS_TYPE, IAdapter, IPlugin, IProvider, UserAuthInfo, WALLET_ADAPTER_TYPE } from "@web3auth/no-modal";
import { Ref, ShallowRef } from "vue";

import type { ModalConfig } from "../interface";
import type { Web3Auth, Web3AuthOptions } from "../modalManager";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig>;
  hideWalletDiscovery?: boolean;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

interface IBaseWeb3AuthComposableContext {
  isConnecting: Ref<boolean>;
  connectError: Ref<Error | null>;
  isConnected: Ref<boolean>;
  provider: Ref<IProvider | null>;
  userInfo: Ref<Partial<AuthUserInfo> | null>;
  isMFAEnabled: Ref<boolean>;
  isInitializing: Ref<boolean>;
  initError: Ref<Error | null>;
  isInitialized: Ref<boolean>;
  status: Ref<ADAPTER_STATUS_TYPE | null>;
  enableMFA(params?: LoginParams): Promise<void>;
  manageMFA(params?: LoginParams): Promise<void>;
  logout(params?: { cleanup: boolean }): Promise<void>;
  addPlugin(plugin: IPlugin): void;
  getPlugin(pluginName: string): IPlugin | null;
  authenticateUser(): Promise<UserAuthInfo>;
  switchChain(params: { chainId: string }): Promise<void>;
}

export interface IWeb3AuthContext extends IBaseWeb3AuthComposableContext {
  web3Auth: ShallowRef<Web3Auth | null>;
  connect(): Promise<IProvider | null>;
}
