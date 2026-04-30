import { WALLET_CONNECTOR_TYPE } from "../wallet";

export type CITADEL_NETWORK = "ethereum" | "solana";

export interface LinkAccountParams {
  /**
   * Name of the external wallet connector to link.
   * Example: WALLET_CONNECTORS.METAMASK, WALLET_CONNECTORS.WALLET_CONNECT_V2
   */
  connectorName: WALLET_CONNECTOR_TYPE | string;

  /**
   * Chain ID to use when generating the wallet identity proof.
   * Defaults to the currently active chain if not specified.
   */
  chainId?: string;
}

export interface LinkedAccountInfo {
  /** Type of the account (e.g. "social", "external_wallet", "account_abstraction") */
  accountType: string;
  /** Address of the account */
  address: string | null;
  /** Auth connection id of the account */
  authConnectionId: string | null;
  /** Chain namespace of the account */
  chainNamespace: string | null;
}

/**
 * Result returned after a successful account-linking operation.
 */
export interface LinkAccountResult {
  /** Whether the Citadel server accepted the linking request. */
  success: boolean;

  /** Refreshed id token for the user */
  idToken: string;

  /** Linked account info */
  linkedAccounts: LinkedAccountInfo[];

  /** Error message from the Citadel server */
  message?: string;
}

/**
 * Result returned after a successful account-unlinking operation.
 */
export interface UnlinkAccountResult {
  /** Whether the Citadel server accepted the linking request. */
  success: boolean;

  /** Refreshed id token for the user */
  idToken: string;

  /** Remaining linked account info */
  linkedAccounts: LinkedAccountInfo[];

  /** Error message from the Citadel server */
  message?: string;
}

export interface CitadelLinkAccountPayload {
  /** Access token to authenticate the request */
  idToken: string;

  /** Network of the account being linked */
  network: CITADEL_NETWORK;

  /** Name of the connector being linked */
  connector: string;

  /** Challenge message to be signed by the user */
  message: string;

  /** Sign In with Web3 signature object */
  signature: {
    /** signature value */
    s: string;
    /** signature type (e.g. "eip191", "sip99") */
    t: string;
  };
}

/**
 * Payload sent to the Citadel account-unlinking endpoint.
 */
export interface UnlinkAccountPayload {
  /** Access token to authenticate the request */
  idToken: string;

  /** Address of the account to unlink */
  address: string;

  /** Network of the account being unlinked */
  network: CITADEL_NETWORK;
}
