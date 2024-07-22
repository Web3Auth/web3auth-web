import type { LoginParams, OpenloginUserInfo } from "@toruslabs/openlogin-utils";
import type {
  ADAPTER_STATUS_TYPE,
  CustomChainConfig,
  IAdapter,
  IPlugin,
  IProvider,
  IWeb3AuthCoreOptions,
  UserAuthInfo,
  WALLET_ADAPTER_TYPE,
} from "@web3auth/base";
import { type Web3AuthNoModal } from "@web3auth/no-modal";
import { Ref, ShallowRef } from "vue";

export type Web3AuthContextConfig = {
  web3AuthOptions: IWeb3AuthCoreOptions;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

interface IBaseWeb3AuthComposableContext {
  isConnected: Ref<boolean>;
  provider: Ref<IProvider | null>;
  userInfo: Ref<Partial<OpenloginUserInfo> | null>;
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
  web3Auth: ShallowRef<Web3AuthNoModal | null>;
  init(): Promise<void>;
  connectTo<T>(walletName: WALLET_ADAPTER_TYPE, loginParams?: T): Promise<IProvider | null>;
}
