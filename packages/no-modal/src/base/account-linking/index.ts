import { post } from "@toruslabs/http-helpers";

import { LinkAccountResult } from "../core/IWeb3Auth";
import { AccountLinkingError } from "../errors";

/**
 * Payload sent to the Citadel account-linking endpoint.
 * Adjust individual field names once the actual Citadel API contract is confirmed.
 */
export interface CitadelLinkRequest {
  /** Web3Auth idToken from the primary AUTH session */
  primaryIdToken: string;
  /** Web3Auth idToken proving ownership of the external wallet */
  walletIdToken: string;
  /** Connector name of the wallet being linked (e.g. "metamask", "wallet-connect-v2") */
  connectorName: string;
  /** Optional chain ID used when generating the wallet proof */
  chainId?: string;
}

/**
 * Response shape returned by the Citadel account-linking endpoint.
 * Extend or narrow these fields once the actual API contract is confirmed.
 */
export interface CitadelLinkResponse {
  /** Any additional payload the server returns */
  [key: string]: unknown;
  success: boolean;
  /** Address of the wallet that was linked, if returned by the server */
  linkedAddress?: string;
  /** Human-readable message from the server */
  message?: string;
}

/**
 * Send both identity proofs to the Citadel account-linking endpoint and
 * return a normalised result.
 *
 * Throws AccountLinkingError when the server returns an error or the request itself fails.
 */
export async function makeAccountLinkingRequest(request: CitadelLinkRequest): Promise<LinkAccountResult> {
  const url = "http://localhost:3020/v1/link/wallet";

  let raw: CitadelLinkResponse;
  try {
    raw = await post<CitadelLinkResponse>(url, request);
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw AccountLinkingError.requestFailed(message, cause);
  }

  if (!raw.success) {
    throw AccountLinkingError.requestFailed(raw.message ?? "Server indicated failure without a message");
  }

  // Omit well-known top-level fields; surface the rest as opaque extra data.
  const { success, linkedAddress, message, ...rest } = raw;
  return {
    success,
    linkedAddress,
    connectorName: request.connectorName,
    // Include extra fields only when present; drop the `message` field which is
    // already surfaced through the error path above.
    data: Object.keys(rest).length > 0 ? { ...rest, ...(message !== undefined ? { message } : {}) } : undefined,
  };
}
