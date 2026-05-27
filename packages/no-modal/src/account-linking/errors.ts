import { ErrorCodes, Web3AuthError } from "../base";

export class AccountLinkingError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    5401: "Account linking request failed",
    5402: "Citadel server URL is not configured",
    5403: "Primary identity token is not available",
    5404: "Failed to obtain wallet proof token",
    5405: "Connector is not supported for wallet linking",
    5406: "Cannot unlink active account",
    5407: "Account not linked",
    5408: "Cannot unlink primary account",
  };

  public constructor(code: number, message?: string, cause?: unknown) {
    super(code, message, cause);
    Object.defineProperty(this, "name", { value: "AccountLinkingError", configurable: true });
  }

  public static fromCode(code: number, extraMessage = "", cause?: unknown): AccountLinkingError {
    return new AccountLinkingError(code, `${AccountLinkingError.messages[code]}. ${extraMessage}`, cause);
  }

  public static requestFailed(extraMessage = "", cause?: unknown): AccountLinkingError {
    return AccountLinkingError.fromCode(5401, extraMessage, cause);
  }

  public static serverNotConfigured(extraMessage = "", cause?: unknown): AccountLinkingError {
    return AccountLinkingError.fromCode(5402, extraMessage, cause);
  }

  public static primaryTokenNotAvailable(extraMessage = "", cause?: unknown): AccountLinkingError {
    return AccountLinkingError.fromCode(5403, extraMessage, cause);
  }

  public static walletProofFailed(extraMessage = "", cause?: unknown): AccountLinkingError {
    return AccountLinkingError.fromCode(5404, extraMessage, cause);
  }

  public static unsupportedConnector(extraMessage = "", cause?: unknown): AccountLinkingError {
    return AccountLinkingError.fromCode(5405, extraMessage, cause);
  }

  public static cannotUnlinkActiveAccount(): AccountLinkingError {
    return AccountLinkingError.fromCode(5406);
  }

  public static accountNotLinked(message = "", cause?: unknown): AccountLinkingError {
    return AccountLinkingError.fromCode(5407, message, cause);
  }

  public static cannotUnlinkPrimaryAccount(): AccountLinkingError {
    return AccountLinkingError.fromCode(5408);
  }

  public toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

export async function getAccountLinkingRequestError(error: unknown): Promise<AccountLinkingError> {
  if (error instanceof Response) {
    if (error.status === 409) {
      return AccountLinkingError.requestFailed("This wallet address is already registered on this dApp");
    }

    if (error.json && typeof error.json === "function") {
      const json = await error.json();
      return AccountLinkingError.requestFailed(json.message ?? "Failed to link account");
    }
  }
  if (error instanceof AccountLinkingError) {
    return error;
  }
  return AccountLinkingError.requestFailed(error instanceof Error ? error.message : JSON.stringify(error), error);
}

export function formatAccountLinkingErrorMessage(error: unknown, fallbackMessage: string = "Unknown error during the operation."): string {
  if (error instanceof AccountLinkingError) {
    return error.toString();
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  try {
    const stringifiedError = JSON.stringify(error);
    return stringifiedError;
  } catch {
    return fallbackMessage;
  }
}
