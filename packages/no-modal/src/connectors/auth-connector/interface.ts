import { type AuthOptions, type BaseRedirectParams, type LoginParams } from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import { type BaseConnectorSettings, type IBaseProvider } from "@/core/base";

export type LoginSettings = Partial<LoginParams> & Partial<BaseRedirectParams>;

export type PrivateKeyProvider = IBaseProvider<string>;

export type WalletServicesSettings = WsEmbedParams & { modalZIndex?: number };

export interface AuthConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: Omit<AuthOptions, "clientId" | "network">;
  loginSettings?: LoginSettings;
  walletServicesSettings?: WalletServicesSettings;
}

export { type AuthOptions, type AuthUserInfo, LOGIN_PROVIDER, type LoginConfig, type LoginParams } from "@web3auth/auth";
