import { type AuthConnectionConfigItem, type AuthOptions, type LoginParams, type WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import { type BaseConnectorSettings, type ConnectedAccountInfo, type IBaseProvider } from "../../base";

export type LoginSettings = Partial<LoginParams>;

export type PrivateKeyProvider = IBaseProvider<string>;

export type WalletServicesSettings = Omit<WsEmbedParams, "chains" | "chainId"> & { modalZIndex?: number };

export interface AuthConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: Omit<AuthOptions, "clientId" | "network" | "authConnectionConfig" | "mfaSettings">;
  loginSettings?: LoginSettings;
  walletServicesSettings?: WalletServicesSettings;
  authConnectionConfig?: (AuthConnectionConfigItem & { isDefault?: boolean })[];
}

export interface UserInfoWithConnectedAccounts {
  /** User id from the Citadel Server */
  id: string;

  /** Connection id of the user */
  connectionId: string;

  /** Identifier of the user. e.g. email, sub */
  identifier: string;

  /** Public address of the user */
  publicAddress: string;

  /** Web3Auth network of the user */
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;

  /** Type of the user. e.g. v1, v2 */
  userType: string;

  /** Connected accounts info, including the primary account */
  accounts: ConnectedAccountInfo[];

  /** Created at timestamp of the user */
  createdAt: string;

  /** Updated at timestamp of the user */
  updatedAt: string;
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
