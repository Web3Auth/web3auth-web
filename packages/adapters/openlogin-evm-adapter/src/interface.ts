import { BaseRedirectParams, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin";
import { CustomChainConfig } from "@web3auth/base";

export type LoginSettings = LoginParams & Partial<BaseRedirectParams>;

export interface OpenloginAdapterOptions {
  chainConfig?: CustomChainConfig;
  adapterSettings?: OpenLoginOptions;
  loginSettings?: LoginSettings;
}
