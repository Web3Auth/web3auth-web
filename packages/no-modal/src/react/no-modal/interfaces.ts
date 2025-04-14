import type { ConnectorFn, IBaseWeb3AuthHookContext, IWeb3AuthCoreOptions, PluginFn } from "@/core/base";

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

export type IWeb3AuthContext = IWeb3AuthInnerContext;
