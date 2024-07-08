import type { IBaseWeb3AuthHookContext, IConnector, IPlugin, IProvider } from "@web3auth/base";
import { type ModalConfig, type Web3Auth, type Web3AuthOptions } from "@web3auth/modal";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  connectors?: IConnector<unknown>[];
  plugins?: IPlugin[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthHookContext {
  web3Auth: Web3Auth | null;
  initModal(params?: { modalConfig?: Record<string, ModalConfig> }): Promise<void>;
  connect(): Promise<IProvider>;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
