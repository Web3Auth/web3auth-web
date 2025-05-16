import { CustomError } from "ts-custom-error";

// @flow
export interface IWeb3AuthError extends CustomError {
  code: number;
  message: string;
  cause?: unknown;
  toString(): string;
}

export type ErrorCodes = {
  [key: number]: string;
};

export abstract class Web3AuthError extends CustomError implements IWeb3AuthError {
  code: number;

  message: string;

  cause?: unknown;

  public constructor(code: number, message?: string, cause?: unknown) {
    // takes care of stack and proto
    super(message);

    this.code = code;
    this.message = message || "";
    this.cause = cause;
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "Web3AuthError" });
  }

  toJSON(): IWeb3AuthError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      cause: this.cause,
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }
}

export class WalletInitializationError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    5001: "Wallet is not found",
    5002: "Wallet is not installed",
    5003: "Wallet is not ready yet",
    5004: "Wallet window is blocked",
    5005: "Wallet window has been closed by the user",
    5006: "Incompatible chain namespace provided",
    5007: "Connector has already been included",
    5008: "Invalid provider Config",
    5009: "Provider is not ready yet",
    5010: "Failed to connect with rpc url",
    5011: "Invalid params passed in",
    5013: "Invalid network provided",
  };

  public constructor(code: number, message?: string, cause?: unknown) {
    // takes care of stack and proto
    super(code, message, cause);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "WalletInitializationError" });
  }

  public static fromCode(code: number, extraMessage = "", cause?: unknown): IWeb3AuthError {
    return new WalletInitializationError(code, `${WalletInitializationError.messages[code]}, ${extraMessage}`, cause);
  }

  // Custom methods
  public static notFound(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5001, extraMessage, cause);
  }

  public static notInstalled(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5002, extraMessage, cause);
  }

  public static notReady(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5003, extraMessage, cause);
  }

  public static windowBlocked(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5004, extraMessage, cause);
  }

  public static windowClosed(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5005, extraMessage, cause);
  }

  public static incompatibleChainNameSpace(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5006, extraMessage, cause);
  }

  public static duplicateConnectorError(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5007, extraMessage, cause);
  }

  public static invalidProviderConfigError(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5008, extraMessage, cause);
  }

  public static providerNotReadyError(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5009, extraMessage, cause);
  }

  public static rpcConnectionError(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5010, extraMessage, cause);
  }

  public static invalidParams(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5011, extraMessage, cause);
  }

  public static invalidNetwork(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletInitializationError.fromCode(5013, extraMessage, cause);
  }
}

/**
 * wallet login errors
 */

export class WalletLoginError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    5111: "Failed to connect with wallet",
    5112: "Failed to disconnect from wallet",
    5113: "Wallet is not connected",
    5114: "Wallet popup has been closed by the user",
    5115: "User has already enabled mfa, please use the @web3auth/web3auth-web sdk for login with mfa",
    5116: "Chain config has not been added. Please add the chain config before calling switchChain",
    5117: "Unsupported operation",
    5118: "useSFAKey flag is enabled but SFA key is not available",
    5119: "User not logged in.",
  };

  public constructor(code: number, message?: string, cause?: unknown) {
    // takes care of stack and proto
    super(code, message, cause);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "WalletLoginError" });
  }

  public static fromCode(code: number, extraMessage = "", cause?: unknown): IWeb3AuthError {
    return new WalletLoginError(code, `${WalletLoginError.messages[code]}. ${extraMessage}`, cause);
  }

  public static connectionError(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5111, extraMessage, cause);
  }

  public static disconnectionError(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5112, extraMessage, cause);
  }

  public static notConnectedError(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5113, extraMessage, cause);
  }

  public static popupClosed(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5114, extraMessage, cause);
  }

  public static mfaEnabled(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5115, extraMessage, cause);
  }

  public static chainConfigNotAdded(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5116, extraMessage, cause);
  }

  public static unsupportedOperation(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5117, extraMessage, cause);
  }

  public static sfaKeyNotFound(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5118, extraMessage, cause);
  }

  public static userNotLoggedIn(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletLoginError.fromCode(5119, extraMessage, cause);
  }
}

export class WalletOperationsError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    5201: "Provided chainId is not allowed",
    5202: "This operation is not allowed",
  };

  public constructor(code: number, message?: string, cause?: unknown) {
    // takes care of stack and proto
    super(code, message, cause);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "WalletOperationsError" });
  }

  public static fromCode(code: number, extraMessage = "", cause?: unknown): IWeb3AuthError {
    return new WalletOperationsError(code, `${WalletOperationsError.messages[code]}, ${extraMessage}`, cause);
  }

  // Custom methods
  public static chainIDNotAllowed(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletOperationsError.fromCode(5201, extraMessage, cause);
  }

  public static operationNotAllowed(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletOperationsError.fromCode(5202, extraMessage, cause);
  }

  public static chainNamespaceNotAllowed(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletOperationsError.fromCode(5203, extraMessage, cause);
  }
}

export class WalletProviderError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    5301: "Expected a single, non-array, object argument.",
    5302: "'args.method' must be a non-empty string.",
    5303: "'args.params' must be an object or array if provided.",
  };

  public constructor(code: number, message?: string, cause?: unknown) {
    // takes care of stack and proto
    super(code, message, cause);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "WalletProviderError" });
  }

  public static fromCode(code: number, extraMessage = "", cause?: unknown): IWeb3AuthError {
    return new WalletOperationsError(code, `${WalletProviderError.messages[code]}, ${extraMessage}`, cause);
  }

  // Custom methods
  public static invalidRequestArgs(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletOperationsError.fromCode(5301, extraMessage, cause);
  }

  public static invalidRequestMethod(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletOperationsError.fromCode(5302, extraMessage, cause);
  }

  public static invalidRequestParams(extraMessage = "", cause?: unknown): IWeb3AuthError {
    return WalletOperationsError.fromCode(5303, extraMessage, cause);
  }
}
