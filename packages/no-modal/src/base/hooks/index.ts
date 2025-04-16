import { CONNECTOR_STATUS_TYPE, IProvider } from "../connector";
import { IPlugin } from "../plugin";

export interface IBaseWeb3AuthHookContext {
  isInitialized: boolean;
  isInitializing: boolean;
  initError: unknown;
  isConnected: boolean;
  isMFAEnabled: boolean;
  provider: IProvider | null;
  status: CONNECTOR_STATUS_TYPE | null;
  getPlugin(pluginName: string): IPlugin | null;
  setIsMFAEnabled(isMFAEnabled: boolean): void;
}
