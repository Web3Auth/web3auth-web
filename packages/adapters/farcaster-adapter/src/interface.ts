import { BaseRedirectParams, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin-utils";
import { BaseAdapterSettings, IBaseProvider } from "@web3auth/base";

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;

export type LoginSettings = Partial<LoginParams> & Partial<BaseRedirectParams>;

export type PrivateKeyProvider = IBaseProvider<string>;

export interface FarcasterAdapterOptions extends BaseAdapterSettings {
  adapterSettings?: MakeOptional<OpenLoginOptions, "clientId" | "network">;
  loginSettings?: LoginSettings;
  privateKeyProvider?: PrivateKeyProvider;
}

export interface FarcasterLoginParams extends LoginParams {
  login_hint?: string;
}
