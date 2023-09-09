import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { ADAPTER_STATUS_TYPE, IProvider, UserAuthInfo, UserInfo } from "../adapter/IAdapter";
import { CustomChainConfig } from "../chain/IChainInterface";
import { WALLET_ADAPTER_TYPE } from "../wallet";

export interface IWeb3Auth extends SafeEventEmitter {
  connected: boolean;
  connectedAdapterName: string | null;
  status: ADAPTER_STATUS_TYPE;
  cachedAdapter: string | null;
  provider: IProvider | null;
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
