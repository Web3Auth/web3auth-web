import { BaseRedirectParams, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin";
import { BaseAdapterSettings } from "@web3auth/base";

export type LoginSettings = LoginParams &
  Partial<BaseRedirectParams> & {
    isSfaUser?: boolean;
  };

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;
export interface OpenloginAdapterOptions extends BaseAdapterSettings {
  adapterSettings?: MakeOptional<OpenLoginOptions, "clientId" | "network">;
  loginSettings?: LoginSettings;
}
