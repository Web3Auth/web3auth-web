import { post } from "@toruslabs/http-helpers";

import { AccountLinkingError } from "../errors";
import { CitadelLinkAccountPayload, LinkAccountResult, UnlinkAccountPayload, UnlinkAccountResult } from "./interfaces";

/**
 * Send both identity proofs to the Citadel account-linking endpoint and
 * return a normalized result.
 *
 * Throws AccountLinkingError when the server returns an error or the request itself fails.
 */
export async function makeAccountLinkingRequest(
  authServerUrl: string,
  accessToken: string,
  payload: CitadelLinkAccountPayload
): Promise<LinkAccountResult> {
  const url = `${authServerUrl}/v1/link/wallet`;

  try {
    const result = await post<LinkAccountResult>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!result.success) {
      throw AccountLinkingError.requestFailed("Failed to link account");
    }
    return result;
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw AccountLinkingError.requestFailed(message, cause);
  }
}

export async function makeAccountUnlinkingRequest(
  authServerUrl: string,
  accessToken: string,
  payload: UnlinkAccountPayload
): Promise<UnlinkAccountResult> {
  const url = `${authServerUrl}/v1/unlink`;
  try {
    const result = await post<UnlinkAccountResult>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!result.success) {
      throw AccountLinkingError.requestFailed("Failed to unlink account");
    }
    return result;
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw AccountLinkingError.requestFailed(message, cause);
  }
}
