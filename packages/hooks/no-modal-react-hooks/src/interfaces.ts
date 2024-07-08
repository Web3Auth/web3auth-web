import type { IBaseWeb3AuthHookContext, IConnector, IPlugin, IProvider, IWeb3AuthCoreOptions, WALLET_CONNECTOR_TYPE } from "@web3auth/base";
import { Web3AuthNoModal } from "@web3auth/no-modal";

export type Web3AuthContextConfig = {
  web3AuthOptions: IWeb3AuthCoreOptions;
  connectors?: IConnector<unknown>[];
  plugins?: IPlugin[];
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthHookContext {
  web3Auth: Web3AuthNoModal | null;
  init(): Promise<void>;
  connectTo<T>(walletName: WALLET_CONNECTOR_TYPE, loginParams?: T): Promise<IProvider | null>;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
