import type { ChainNamespaceType } from "../chain/IChainInterface";
import { type Connection, CONNECTOR_STATUS_TYPE } from "../connector";
import { IPlugin } from "../plugin";

export interface IBaseWeb3AuthHookContext {
  chainId: string | null;
  chainNamespace: ChainNamespaceType | null;
  isInitialized: boolean;
  isInitializing: boolean;
  initError: unknown;
  isConnected: boolean;
  isAuthorized: boolean;
  /**
   * Get Provider State Syncing status for the primary connector.
   * On init or after chain namespace change, the provider state might not be ready yet, with the accounts still loading.
   * During this time, the provider state syncing status will be true.
   */
  isProviderStateSyncing: boolean;
  /**
   * Get Account Ready status for the primary connector.
   * On init or after chain namespace change, the accounts might not be ready yet, with the accounts still loading.
   * After the accounts are loaded, the account ready status will be true.
   */
  isAccountReady: boolean;
  isMFAEnabled: boolean;
  connection: Connection | null;
  status: CONNECTOR_STATUS_TYPE | null;
  getPlugin(pluginName: string): IPlugin | null;
  setIsMFAEnabled(isMFAEnabled: boolean): void;
}
