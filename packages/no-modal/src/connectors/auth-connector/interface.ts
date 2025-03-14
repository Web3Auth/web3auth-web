import { type AuthOptions, type LoginParams } from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import { type BaseConnectorSettings, type IBaseProvider } from "@/core/base";

export type LoginSettings = Partial<LoginParams>;

export type PrivateKeyProvider = IBaseProvider<string>;

export type WalletServicesSettings = WsEmbedParams & { modalZIndex?: number };

export interface AuthConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: Omit<AuthOptions, "clientId" | "network">;
  loginSettings?: LoginSettings;
  walletServicesSettings?: WalletServicesSettings;
}

export {
  AUTH_CONNECTION,
  type AUTH_CONNECTION_TYPE,
  type AuthConnectionConfig,
  type AuthOptions,
  type AuthUserInfo,
  type LoginParams,
} from "@web3auth/auth";
