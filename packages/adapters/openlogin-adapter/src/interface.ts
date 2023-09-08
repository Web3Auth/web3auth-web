import { BaseRedirectParams, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin-utils";
import { BaseAdapterSettings, IBaseProvider } from "@web3auth/base";

export type LoginSettings = Partial<LoginParams> & Partial<BaseRedirectParams>;

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;

export type PrivateKeyProvider = IBaseProvider<string>;

export interface OpenloginAdapterOptions extends BaseAdapterSettings {
  adapterSettings?: MakeOptional<OpenLoginOptions, "clientId" | "network"> & {
    useCoreKitKey?: boolean;
  };
  loginSettings?: LoginSettings;
  privateKeyProvider?: PrivateKeyProvider;
}

export * from "@toruslabs/openlogin-utils";
export { type LoginConfig } from "@toruslabs/openlogin-utils";
