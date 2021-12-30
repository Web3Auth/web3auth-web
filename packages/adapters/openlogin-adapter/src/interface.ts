import type { BaseRedirectParams, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin";
import { CustomChainConfig } from "@web3auth/base";

type LoginSettings = LoginParams & Partial<BaseRedirectParams>;
export type { BaseRedirectParams, LoginSettings, OpenLoginOptions };

export interface OpenloginAdapterOptions {
  chainConfig?: CustomChainConfig;
  adapterSettings: OpenLoginOptions;
  loginSettings?: LoginSettings;
}
