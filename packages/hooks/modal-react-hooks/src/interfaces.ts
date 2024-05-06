import type { ADAPTER_STATUS_TYPE, CustomChainConfig, IAdapter, IPlugin, IProvider, UserAuthInfo } from "@web3auth/base";
import { type ModalConfig, type Web3Auth, type Web3AuthOptions } from "@web3auth/modal";
import { type LoginParams, type OpenloginUserInfo } from "@web3auth/openlogin-adapter";
import type { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export interface IWeb3authInnerContext {
  web3Auth: Web3Auth | null;
  isConnected: boolean;
  provider: IProvider | null;
  userInfo: Partial<OpenloginUserInfo> | null;
  isMFAEnabled: boolean;
  isInitialized: boolean;
  status: ADAPTER_STATUS_TYPE | null;
  walletServicesPlugin: WalletServicesPlugin | null;
  initModal(params?: { modalConfig?: Record<string, ModalConfig> }): Promise<void>;
  enableMFA(params?: LoginParams): Promise<void>;
  logout(params?: { cleanup: boolean }): Promise<void>;
  connect(): Promise<IProvider>;
  addAndSwitchChain(chainConfig: CustomChainConfig): Promise<void>;
  addPlugin(plugin: IPlugin): void;
  authenticateUser(): Promise<UserAuthInfo>;
  addChain(chainConfig: CustomChainConfig): Promise<void>;
  switchChain(params: { chainId: string }): Promise<void>;
}

export interface IWalletServicesContext {
  plugin: WalletServicesPlugin | null;
  isConnected: boolean;
  showWalletConnectScanner(): Promise<void>;
  showCheckout(): Promise<void>;
  showWalletUI(): Promise<void>;
}

export type IWeb3authContext = IWeb3authInnerContext;
