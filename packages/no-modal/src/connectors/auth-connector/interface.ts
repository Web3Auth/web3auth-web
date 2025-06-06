import { type AuthConnectionConfigItem, type AuthOptions, type LoginParams } from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import { type BaseConnectorSettings, type IBaseProvider } from "../../base";

export type LoginSettings = Partial<LoginParams>;

export type PrivateKeyProvider = IBaseProvider<string>;

export type WalletServicesSettings = Omit<WsEmbedParams, "chains" | "chainId"> & { modalZIndex?: number };

export interface AuthConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: Omit<AuthOptions, "clientId" | "network" | "authConnectionConfig" | "mfaSettings">;
  loginSettings?: LoginSettings;
  walletServicesSettings?: WalletServicesSettings;
  authConnectionConfig?: (AuthConnectionConfigItem & { isDefault?: boolean })[];
}

export {
  AUTH_CONNECTION,
  type AUTH_CONNECTION_TYPE,
  type AuthConnectionConfig,
  type AuthOptions,
  type AuthUserInfo,
  type LoginParams,
  MFA_FACTOR,
  type MFA_FACTOR_TYPE,
  MFA_LEVELS,
  type MFA_SETTINGS,
  type MfaLevelType,
} from "@web3auth/auth";
