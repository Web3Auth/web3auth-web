import type { IWeb3AuthState, WalletServicesPluginType } from "@web3auth/no-modal";
import type { IWeb3AuthInnerContext as INoModalWeb3AuthInnerContext } from "@web3auth/no-modal/react";

import type { Web3Auth, Web3AuthOptions } from "../modalManager";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
  initialState?: IWeb3AuthState;
}

export interface IWeb3AuthInnerContext extends Omit<INoModalWeb3AuthInnerContext, "web3Auth"> {
  web3Auth: Web3Auth | null;
}
export interface IWalletServicesContext {
  ready: boolean;
  connecting: boolean;
  plugin: WalletServicesPluginType | null;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
