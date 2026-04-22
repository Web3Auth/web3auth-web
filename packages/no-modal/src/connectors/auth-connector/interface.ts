import type { Wallet } from "@wallet-standard/base";
import { type AuthConnectionConfigItem, type AuthOptions, type LoginParams, type WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";
import { type WsEmbedParams } from "@web3auth/ws-embed";

import {
  type BaseConnectorSettings,
  type ConnectedAccountInfo,
  type ConnectorNamespaceType,
  type IBaseProvider,
  type IConnector,
  type IProvider,
  LinkAccountParams,
  LinkAccountResult,
  UnlinkAccountResult,
  type WALLET_CONNECTOR_TYPE,
} from "../../base";

export type LoginSettings = Partial<LoginParams>;

export type PrivateKeyProvider = IBaseProvider<string>;

export type WalletServicesSettings = Omit<WsEmbedParams, "chains" | "chainId"> & { modalZIndex?: number };

export interface AuthConnectorAccountLinkingHandlers {
  getCurrentChainId(): string | null;
  getStoredAuthSessionTokens(): { accessToken: string | null; idToken: string | null };
  getActiveAccount(): ConnectedAccountInfo | null;
  setActiveAccount(account: ConnectedAccountInfo | null): Promise<void>;
  setCurrentChain(chainId: string): Promise<void>;
  setIdToken(idToken: string): Promise<void>;
  bindEthereumSigningProxy(ethereumProvider: IProvider, connectorName: WALLET_CONNECTOR_TYPE | string): Promise<void>;
  assignCurrentConnection(params: {
    ethereumProvider: IProvider | null;
    solanaWallet: Wallet | null;
    connectorName: string;
    connectorNamespace: ConnectorNamespaceType;
  }): void;
  setAuxiliarySigningConnector(accountId: string, connector: IConnector<unknown>): void;
  getChainIdForConnectedAccount(account: Pick<ConnectedAccountInfo, "chainNamespace" | "connector">, preferredChainId?: string | null): string;
  assertSwitchAccountConnectorMatchesTarget(
    connector: IConnector<unknown>,
    account: Pick<ConnectedAccountInfo, "chainNamespace" | "connector" | "eoaAddress">
  ): Promise<void>;
  toSwitchAccountConnectorError(account: Pick<ConnectedAccountInfo, "connector" | "eoaAddress">, error: unknown): Error;
  getNetworkForUnlinkAddress(accounts: ConnectedAccountInfo[], address: string): "ethereum" | "solana";
  getLinkingWalletProof(
    connectorName: WALLET_CONNECTOR_TYPE | string,
    chainId?: string
  ): Promise<{
    address: string;
    challenge: string;
    signature: string;
    signatureType: "eip191" | "sip99";
    network: "ethereum" | "solana";
  }>;
  createIsolatedWalletConnector(connectorName: WALLET_CONNECTOR_TYPE | string, chainId: string): Promise<IConnector<unknown>>;
  emitConnectionUpdated(): void;
}

export interface AuthConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: Omit<AuthOptions, "clientId" | "network" | "authConnectionConfig" | "mfaSettings">;
  loginSettings?: LoginSettings;
  walletServicesSettings?: WalletServicesSettings;
  authConnectionConfig?: (AuthConnectionConfigItem & { isDefault?: boolean })[];
  accountLinkingHandlers?: AuthConnectorAccountLinkingHandlers;
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

export interface IAuthConnector {
  /**
   * Switch the active connection to a linked wallet: connects an isolated
   * instance of that wallet’s connector, updates `connection.ethereumProvider` / `solanaWallet`,
   * and emits `connection_updated` so Wagmi/UI can resync.
   * The auxiliary connector stays connected (not torn down after switch). The previous auxiliary
   * connector is disconnected when starting another switch or when the primary session disconnects.
   *
   * Requires an AUTH primary session and a matching `userInfo.connectedAccounts` entry.
   */
  switchAccount(account: ConnectedAccountInfo): Promise<void>;

  /**
   * Link an external wallet to the currently authenticated user account
   * via the Citadel account-linking endpoint.
   *
   * Requires:
   * - The user to be currently connected with the AUTH connector.
   * - `accountLinking.serverUrl` to be set in the Web3Auth constructor options.
   *
   * @param params - Linking parameters including the target connector name.
   * @returns A result object confirming the link, including the linked address.
   */
  linkAccount(params: LinkAccountParams): Promise<LinkAccountResult>;

  /**
   * Unlink an external wallet from the currently authenticated user account
   * via the Citadel account-unlinking endpoint.
   *
   * @param params - Unlinking parameters including the target account address.
   * @returns A result object confirming the unlink.
   */
  unlinkAccount(address: string): Promise<UnlinkAccountResult>;

  /** @internal */
  setAccountLinkingHandlers(handlers: AuthConnectorAccountLinkingHandlers): void;
}
