import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { WhiteLabelData } from "@toruslabs/openlogin-utils";

import { ADAPTER_STATUS_TYPE, IAdapter, IBaseProvider, IProvider, OPENLOGIN_NETWORK_TYPE, UserAuthInfo, UserInfo } from "../adapter/IAdapter";
import { CustomChainConfig } from "../chain/IChainInterface";
import { WALLET_ADAPTER_TYPE } from "../wallet";

export interface IWeb3Auth extends SafeEventEmitter {
  connected: boolean;
  connectedAdapterName: string | null;
  status: ADAPTER_STATUS_TYPE;
  cachedAdapter: string | null;
  provider: IProvider | null;
  walletAdapters: Record<string, IAdapter<unknown>>;
  init(): Promise<void>;
  /**
   * Connect to a specific wallet adapter
   * @param walletName - Key of the walletAdapter to use.
   */
  connectTo<T>(walletName: WALLET_ADAPTER_TYPE, loginParams?: T): Promise<IProvider | null>;
  logout(options?: { cleanup: boolean }): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo>>;
  authenticateUser(): Promise<UserAuthInfo>;
  addChain(chainConfig: CustomChainConfig): Promise<void>;
  switchChain(params: { chainId: string }): Promise<void>;
}

export interface Web3AuthNoModalOptions {
  /**
   * Client id for web3auth.
   * You can obtain your client id from the web3auth developer dashboard.
   * You can set any random string for this on localhost.
   */
  clientId: string;
  /**
   * custom chain configuration for chainNamespace
   *
   * @defaultValue mainnet config of provided chainNamespace
   */
  chainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;

  /**
   * setting to true will enable logs
   *
   * @defaultValue false
   */
  enableLogging?: boolean;
  /**
   * setting to "local" will persist social login session accross browser tabs.
   *
   * @defaultValue "local"
   */
  storageKey?: "session" | "local";

  /**
   * sessionTime (in seconds) for idToken issued by Web3Auth for server side verification.
   * @defaultValue 86400
   *
   * Note: max value can be 7 days (86400 * 7) and min can be  1 day (86400)
   */
  sessionTime?: number;
  /**
   * Web3Auth Network to use for the session & the issued idToken
   * @defaultValue mainnet
   */
  web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE;

  /**
   * Uses core-kit key with web3auth provider
   * @defaultValue false
   */
  useCoreKitKey?: boolean;

  /**
   * WhiteLabel options for web3auth
   */
  uiConfig?: WhiteLabelData;

  /**
   * Private key provider for your chain namespace
   */
  privateKeyProvider?: IBaseProvider<string>;
}
