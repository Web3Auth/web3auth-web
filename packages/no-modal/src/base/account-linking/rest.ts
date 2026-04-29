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
  let result: LinkAccountResult;

  try {
    result = await post<LinkAccountResult>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw AccountLinkingError.requestFailed(message, cause);
  }

  if (!result.success) {
    const errMessage = result.message ?? "Failed to link account";
    throw AccountLinkingError.requestFailed(errMessage);
  }

  return result;
}

export async function makeAccountUnlinkingRequest(
  authServerUrl: string,
  accessToken: string,
  payload: UnlinkAccountPayload
): Promise<UnlinkAccountResult> {
  const url = `${authServerUrl}/v1/unlink`;
  let result: UnlinkAccountResult;

  try {
    result = await post<UnlinkAccountResult>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw AccountLinkingError.requestFailed(message, cause);
  }

  if (!result.success) {
    const errMessage = result.message ?? "Failed to unlink account";
    throw AccountLinkingError.requestFailed(errMessage);
  }

  return result;
}
