import { post } from "@toruslabs/http-helpers";

import { LinkAccountResult } from "../core/IWeb3Auth";
import { AccountLinkingError } from "../errors";

/**
 * Payload sent to the Citadel account-linking endpoint.
 * Adjust individual field names once the actual Citadel API contract is confirmed.
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
 * Send both identity proofs to the Citadel account-linking endpoint and
 * return a normalised result.
 *
 * Throws AccountLinkingError when the server returns an error or the request itself fails.
 */
export async function makeAccountLinkingRequest(payload: CitadelLinkAccountPayload): Promise<LinkAccountResult> {
  // eslint-disable-next-line no-console
  console.log("makeAccountLinkingRequest::request", payload);
  const url = "http://localhost:3020/v1/link/wallet";

  try {
    const result = await post<LinkAccountResult>(url, payload);
    if (!result.success) {
      throw AccountLinkingError.requestFailed("Failed to link account");
    }
    return result;
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw AccountLinkingError.requestFailed(message, cause);
  }
}
