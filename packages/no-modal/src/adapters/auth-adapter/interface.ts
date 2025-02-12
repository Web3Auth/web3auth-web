import { type AuthOptions, type BaseRedirectParams, type LoginParams } from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import { type BaseAdapterSettings, type IBaseProvider } from "@/core/base";

export type LoginSettings = Partial<LoginParams> & Partial<BaseRedirectParams>;

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>;

export type PrivateKeyProvider = IBaseProvider<string>;

export interface AuthAdapterOptions extends BaseAdapterSettings {
  adapterSettings?: MakeOptional<AuthOptions, "clientId" | "network">;
  loginSettings?: LoginSettings;
  walletSettings?: WsEmbedParams;
}

export { type AuthOptions, type AuthUserInfo, LOGIN_PROVIDER, type LoginConfig, type LoginParams } from "@web3auth/auth";
