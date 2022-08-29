import { BaseRedirectParams, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin";
import { CustomChainConfig } from "@web3auth/base";

export type LoginSettings = LoginParams & Partial<BaseRedirectParams>;

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;
export interface OpenloginAdapterOptions {
  chainConfig?: CustomChainConfig | null;
  adapterSettings?: MakeOptional<OpenLoginOptions, "clientId">;
  loginSettings?: LoginSettings;
}
