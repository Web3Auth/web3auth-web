import type { ConnectorFn, IBaseWeb3AuthHookContext, IWeb3AuthCoreOptions, IWeb3AuthState, PluginFn } from "../base";
import { Web3AuthNoModal } from "../noModal";
import type { WalletServicesPluginType } from "../plugins/wallet-services-plugin";

export type Web3AuthContextConfig = {
  web3AuthOptions: IWeb3AuthCoreOptions;
  connectors?: ConnectorFn[];
  plugins?: PluginFn[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
  initialState?: IWeb3AuthState;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthHookContext {
  web3Auth: Web3AuthNoModal | null;
}

export interface IWalletServicesContext {
  ready: boolean;
  connecting: boolean;
  plugin: WalletServicesPluginType | null;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
