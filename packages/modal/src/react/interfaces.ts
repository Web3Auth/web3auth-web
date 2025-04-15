import type { IBaseWeb3AuthHookContext } from "@web3auth/no-modal";

import type { Web3Auth, Web3AuthOptions } from "../modalManager";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export interface IWeb3AuthInnerContext extends IBaseWeb3AuthHookContext {
  web3Auth: Web3Auth | null;
}

export type IWeb3AuthContext = IWeb3AuthInnerContext;
