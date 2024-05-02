import type { ADAPTER_STATUS_TYPE, CustomChainConfig, IPlugin, IProvider, UserAuthInfo } from "@web3auth/base";
import { type ModalConfig, type Web3Auth } from "@web3auth/modal";
import { type LoginParams, type OpenloginUserInfo } from "@web3auth/openlogin-adapter";
import type { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";

export interface IWeb3authContext {
  web3Auth: Web3Auth | null;
  isConnected: boolean;
  provider: IProvider | null;
  userInfo: Partial<OpenloginUserInfo> | null;
  isMFAEnabled: boolean;
  isInitialized: boolean;
  status: ADAPTER_STATUS_TYPE | null;
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

export type IContext = { core: IWeb3authContext; walletServices: IWalletServicesContext };
