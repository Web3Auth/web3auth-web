import type { AuthUserInfo, LoginParams } from "@web3auth/auth";
import type { ADAPTER_STATUS_TYPE, CustomChainConfig, IAdapter, IPlugin, IProvider, UserAuthInfo } from "@web3auth/base";
import { type ModalConfig, type Web3Auth, type Web3AuthOptions } from "@web3auth/modal";
import { Ref, ShallowRef } from "vue";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

interface IBaseWeb3AuthComposableContext {
  isConnected: Ref<boolean>;
  provider: Ref<IProvider | null>;
  userInfo: Ref<Partial<AuthUserInfo> | null>;
  isMFAEnabled: Ref<boolean>;
  isInitialized: Ref<boolean>;
  status: Ref<ADAPTER_STATUS_TYPE | null>;
  enableMFA(params?: LoginParams): Promise<void>;
  logout(params?: { cleanup: boolean }): Promise<void>;
  addAndSwitchChain(chainConfig: CustomChainConfig): Promise<void>;
  addPlugin(plugin: IPlugin): void;
  getPlugin(pluginName: string): IPlugin | null;
  authenticateUser(): Promise<UserAuthInfo>;
  addChain(chainConfig: CustomChainConfig): Promise<void>;
  switchChain(params: { chainId: string }): Promise<void>;
}

export interface IWeb3AuthContext extends IBaseWeb3AuthComposableContext {
  web3Auth: ShallowRef<Web3Auth | null>;
  initModal(params?: { modalConfig?: Record<string, ModalConfig> }): Promise<void>;
  connect(): Promise<IProvider | null>;
}
