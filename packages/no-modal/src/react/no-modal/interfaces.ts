import type { ConnectorFn, IBaseWeb3AuthHookContext, IProvider, IWeb3AuthCoreOptions, PluginFn, WALLET_CONNECTOR_TYPE } from "@/core/base";

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
  connectTo<T>(walletName: WALLET_CONNECTOR_TYPE, loginParams?: T): Promise<IProvider | null>;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
