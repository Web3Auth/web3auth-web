import type { WalletServicesPluginType } from "@web3auth/no-modal";
import type { IWeb3AuthInnerContext as INoModalWeb3AuthInnerContext } from "@web3auth/no-modal/vue";
import { Ref, ShallowRef } from "vue";

import type { Web3Auth, Web3AuthOptions } from "../modalManager";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
};

export interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export interface IWeb3AuthInnerContext extends Omit<INoModalWeb3AuthInnerContext, "web3Auth"> {
  web3Auth: ShallowRef<Web3Auth | null>;
}

export interface IWalletServicesInnerContext {
  plugin: ShallowRef<WalletServicesPluginType | null>;
  ready: Ref<boolean>;
  connecting: Ref<boolean>;
}
