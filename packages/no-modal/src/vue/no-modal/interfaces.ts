import type { AuthUserInfo, LoginParams } from "@web3auth/auth";
import type { Ref, ShallowRef } from "vue";

import type {
  CONNECTOR_STATUS_TYPE,
  ConnectorFn,
  IPlugin,
  IProvider,
  IWeb3AuthCoreOptions,
  LoginParamMap,
  PluginFn,
  UserAuthInfo,
  WALLET_CONNECTOR_TYPE,
} from "@/core/base";

import { type Web3AuthNoModal } from "../../noModal";
export type Web3AuthContextConfig = {
  web3AuthOptions: IWeb3AuthCoreOptions;
  connectors?: ConnectorFn[];
  plugins?: PluginFn[];
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
  status: Ref<CONNECTOR_STATUS_TYPE | null>;
  enableMFA(params?: LoginParams): Promise<void>;
  manageMFA(params?: LoginParams): Promise<void>;
  logout(params?: { cleanup: boolean }): Promise<void>;
  getPlugin(pluginName: string): IPlugin | null;
  authenticateUser(): Promise<UserAuthInfo>;
  switchChain(params: { chainId: string }): Promise<void>;
}

export interface IWeb3AuthContext extends IBaseWeb3AuthComposableContext {
  web3Auth: ShallowRef<Web3AuthNoModal | null>;
  connectTo<T extends WALLET_CONNECTOR_TYPE>(walletName: T, loginParams?: LoginParamMap[T]): Promise<IProvider | null>;
}
