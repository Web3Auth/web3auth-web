import { BaseRedirectParams, LoginConfig, LoginParams, OpenLoginOptions } from "@toruslabs/openlogin-utils";
import { BaseAdapterSettings } from "@web3auth/base";
import { IBaseProvider } from "@web3auth/base-provider";

export type LoginSettings = Partial<LoginParams> & Partial<BaseRedirectParams>;

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;

export type PrivateKeyProvider = IBaseProvider<string>;
export interface OpenloginAdapterOptions extends BaseAdapterSettings {
  adapterSettings?: MakeOptional<OpenLoginOptions, "clientId" | "network"> & {
    useCoreKitKey?: boolean;
    provider?: PrivateKeyProvider;
  };
  loginSettings?: LoginSettings;
}

export { LoginConfig };
