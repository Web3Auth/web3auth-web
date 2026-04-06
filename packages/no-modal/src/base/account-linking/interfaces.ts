import { WALLET_CONNECTOR_TYPE } from "../wallet";

/**
 * Parameters for linking an external wallet to the currently authenticated account.
 */
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

  /**
   * Pre-obtained wallet identity token.
   * When provided, the SDK skips the internal wallet-connection step
   * and uses this token directly for the Citadel request.
   * Obtain this token by connecting the external wallet separately and
   * calling connector.getIdentityToken().
   */
  walletIdToken?: string;
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
}

/**
 * Payload sent to the Citadel account-linking endpoint.
 */
export interface CitadelLinkAccountPayload {
  /** Access token to authenticate the request */
  idToken: string;

  /** Network of the account being linked */
  network: "ethereum" | "solana";

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
  network: "ethereum" | "solana";
}
