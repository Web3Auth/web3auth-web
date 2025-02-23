import type { ConnectorFn, IBaseWeb3AuthHookContext, IProvider, PluginFn, WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

import { type ModalConfig } from "../interface";
import type { Web3Auth, Web3AuthOptions } from "../modalManager";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  modalConfig?: Record<WALLET_CONNECTOR_TYPE, ModalConfig>;
  hideWalletDiscovery?: boolean;
  connectors?: ConnectorFn[];
  plugins?: PluginFn[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthHookContext {
  web3Auth: Web3Auth | null;
  connect(): Promise<IProvider>;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
