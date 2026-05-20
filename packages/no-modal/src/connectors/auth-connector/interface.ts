import type { Wallet } from "@wallet-standard/base";
import { type AuthConnectionConfigItem, type AuthOptions, type LoginParams, type WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import { LinkAccountResult, UnlinkAccountResult } from "../../account-linking";
import {
  type BaseConnectorSettings,
  type ConnectorNamespaceType,
  type IBaseProvider,
  type IConnector,
  type IProvider,
  type LinkedAccountInfo,
  type WALLET_CONNECTOR_TYPE,
} from "../../base";

export type LoginSettings = Partial<LoginParams>;

export type PrivateKeyProvider = IBaseProvider<string>;

export type WalletServicesSettings = Omit<WsEmbedParams, "chains" | "chainId"> & { modalZIndex?: number };

export interface AuthConnectorProviderState {
  chainId: string;
  accounts: string[];
  isUnlocked: boolean;
}

export interface AuthConnectorData {
  providerState: AuthConnectorProviderState | null;
  isProviderStateSyncing: boolean;
  isAccountReady: boolean;
}

export interface AuthConnectorSessionTokens {
  accessToken: string | null;
  idToken: string | null;
}

export interface AuthConnectorLinkAccountParams {
  authSessionTokens: AuthConnectorSessionTokens;
  walletConnector: IConnector<unknown>;
  connectorName: WALLET_CONNECTOR_TYPE | string;
  chainId?: string;
}

export interface AuthConnectorSwitchAccountContext {
  activeAccount: LinkedAccountInfo | null;
  currentChainId: string | null;
}

export type AuthConnectorSwitchAccountResult =
  | {
      kind: "primary";
      targetAccount: LinkedAccountInfo;
      activeAccount: null;
      activeChainId: string;
      connectorName: WALLET_CONNECTOR_TYPE;
      connectorNamespace: ConnectorNamespaceType;
      ethereumProvider: IProvider | null;
      solanaWallet: Wallet | null;
    }
  | {
      kind: "external";
      targetAccount: LinkedAccountInfo;
      activeAccount: LinkedAccountInfo;
      activeChainId: string;
    };

export interface AuthConnectorUnlinkAccountParams {
  authSessionTokens: AuthConnectorSessionTokens;
  address: string;
}

export interface AuthConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: Omit<AuthOptions, "clientId" | "network" | "authConnectionConfig" | "mfaSettings">;
  loginSettings?: LoginSettings;
  walletServicesSettings?: WalletServicesSettings;
  authConnectionConfig?: (AuthConnectionConfigItem & { isDefault?: boolean })[];
}

export interface UserInfoWithLinkedAccounts {
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
  accounts: LinkedAccountInfo[];

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

export interface IAuthConnector {
  /**
   * Get Provider State Syncing status for the primary connector.
   * On init or after chain namespace change, the provider state might not be ready yet, with the accounts still loading.
   * During this time, the provider state syncing status will be true.
   */
  readonly isProviderStateSyncing: boolean;

  /**
   * Get Account Ready status for the primary connector.
   * On init or after chain namespace change, the accounts might not be ready yet, with the accounts still loading.
   * After the accounts are loaded, the account ready status will be true.
   */
  readonly isAccountReady: boolean;

  syncProviderState(): Promise<AuthConnectorProviderState | null>;

  /**
   * Resolve the target account and connector-owned switch metadata.
   * `noModal` applies the returned result to SDK state and providers.
   */
  switchAccount(account: LinkedAccountInfo, context: AuthConnectorSwitchAccountContext): Promise<AuthConnectorSwitchAccountResult>;

  /**
   * Link an external wallet to the authenticated user by using the
   * `noModal`-provided isolated wallet connector to generate the proof.
   */
  linkAccount(params: AuthConnectorLinkAccountParams): Promise<LinkAccountResult>;

  /**
   * Unlink an external wallet from the authenticated user account.
   */
  unlinkAccount(params: AuthConnectorUnlinkAccountParams): Promise<UnlinkAccountResult>;

  /**
   * Get the connected accounts for the authenticated user.
   */
  getLinkedAccounts(): Promise<LinkedAccountInfo[]>;
}
