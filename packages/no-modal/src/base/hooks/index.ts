import type { ChainNamespaceType } from "../chain/IChainInterface";
import { type Connection, CONNECTOR_STATUS_TYPE } from "../connector";
import { IPlugin } from "../plugin";

export interface IBaseWeb3AuthHookContext {
  currentChainIds: Partial<Record<ChainNamespaceType, string>>;
  syncCurrentChainIdsFromSdk: () => void;
  isInitialized: boolean;
  isInitializing: boolean;
  initError: unknown;
  isConnected: boolean;
  isAuthorized: boolean;
  isMFAEnabled: boolean;
  connection: Connection | null;
  status: CONNECTOR_STATUS_TYPE | null;
  getPlugin(pluginName: string): IPlugin | null;
  setIsMFAEnabled(isMFAEnabled: boolean): void;
}
