import { post } from "@toruslabs/http-helpers";

import { AccountLinkingError } from "../errors";
import { CitadelLinkAccountPayload, LinkAccountResult, UnlinkAccountPayload, UnlinkAccountResult } from "./interfaces";

/**
 * Send both identity proofs to the Citadel account-linking endpoint and
 * return a normalized result.
 *
 * Throws AccountLinkingError when the server returns an error or the request itself fails.
 */
export async function makeAccountLinkingRequest(payload: CitadelLinkAccountPayload): Promise<LinkAccountResult> {
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

export async function makeAccountUnlinkingRequest(payload: UnlinkAccountPayload): Promise<UnlinkAccountResult> {
  const url = "http://localhost:3020/v1/unlink/wallet";
  try {
    const result = await post<UnlinkAccountResult>(url, payload);
    if (!result.success) {
      throw AccountLinkingError.requestFailed("Failed to unlink account");
    }
    return result;
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw AccountLinkingError.requestFailed(message, cause);
  }
}
