import type { ConnectorFn, IBaseWalletServicesHookContext, IBaseWeb3AuthHookContext, IWeb3AuthCoreOptions, PluginFn } from "@/core/base";
import type { WalletServicesPluginType } from "@/core/wallet-services-plugin";

import { Web3AuthNoModal } from "../../noModal";

export type Web3AuthContextConfig = {
  web3AuthOptions: IWeb3AuthCoreOptions;
  connectors?: ConnectorFn[];
  plugins?: PluginFn[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthHookContext {
  web3Auth: Web3AuthNoModal | null;
}

export interface IWalletServicesContext extends IBaseWalletServicesHookContext {
  plugin: WalletServicesPluginType | null;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
