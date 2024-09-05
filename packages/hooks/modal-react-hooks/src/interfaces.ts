import type { IAdapter, IBaseWeb3AuthHookContext, IPlugin, IProvider, WALLET_ADAPTER_TYPE } from "@web3auth/base";
import { type ModalConfig, type Web3Auth, type Web3AuthOptions } from "@web3auth/modal";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
  modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig>;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthHookContext {
  web3Auth: Web3Auth | null;
  connect(): Promise<IProvider>;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
