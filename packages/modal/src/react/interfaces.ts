import type { IBaseWeb3AuthHookContext, IWeb3AuthState, WalletServicesPluginType } from "@web3auth/no-modal";

import type { Web3Auth, Web3AuthOptions } from "../modalManager";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
  initialState?: IWeb3AuthState;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthHookContext {
  web3Auth: Web3Auth | null;
}
export interface IWalletServicesContext {
  ready: boolean;
  connecting: boolean;
  plugin: WalletServicesPluginType | null;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
