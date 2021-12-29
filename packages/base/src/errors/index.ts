import { CustomError } from "ts-custom-error";

// @flow
export interface IWeb3AuthError extends CustomError {
  name: string;
  code: number;
  message: string;
  toString(): string;
}

export type ErrorCodes = {
  [key: number]: string;
};

export abstract class Web3AuthError extends CustomError implements IWeb3AuthError {
  code: number;

  message: string;

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(message);

    this.code = code;
    this.message = message || "";
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "TkeyError" });
  }

  toJSON(): IWeb3AuthError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }
}

/**
 * 20XX - wallet login errors
 */

export class WalletLoginError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    // Misc
    5001: "Wallet is not found",
    5002: "Wallet is not installed",
    5003: "Wallet is not ready yet",
    5004: "Wallet window is blocked",
    5005: "Wallet window has been closed by the user",
    5006: "Incompatible chain namespace provided",
    5007: "Adapter has already been included",
  };

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "WalletLoginError" });
  }

  public static fromCode(code: number, extraMessage = ""): IWeb3AuthError {
    return new WalletLoginError(code, `${WalletLoginError.messages[code]}${extraMessage}`);
  }

  // Custom methods
  public static notFound(extraMessage = ""): IWeb3AuthError {
    return WalletLoginError.fromCode(5001, extraMessage);
  }

  public static notInstalled(extraMessage = ""): IWeb3AuthError {
    return WalletLoginError.fromCode(5002, extraMessage);
  }

  public static notReady(extraMessage = ""): IWeb3AuthError {
    return WalletLoginError.fromCode(5003, extraMessage);
  }

  public static windowBlocked(extraMessage = ""): IWeb3AuthError {
    return WalletLoginError.fromCode(5004, extraMessage);
  }

  public static windowClosed(extraMessage = ""): IWeb3AuthError {
    return WalletLoginError.fromCode(5005, extraMessage);
  }

  public static incompatibleChainNameSpace(extraMessage = ""): IWeb3AuthError {
    return WalletLoginError.fromCode(5006, extraMessage);
  }

  public static duplicateAdapterError(extraMessage = ""): IWeb3AuthError {
    return WalletLoginError.fromCode(5007, extraMessage);
  }
}

/**
 * 20XX - wallet account/keys errors
 */
export class WalletAccountError extends Web3AuthError {
  name = "WalletAccountError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 2101;
  }
}

export class WalletPublicKeyError extends Web3AuthError {
  name = "WalletPublicKeyError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 2102;
  }
}

export class WalletKeypairError extends Web3AuthError {
  name = "WalletKeypairError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 2103;
  }
}

/**
 * 10XX - wallet adapter errors (can be displayed in UI)
 */
export class WalletConnectionError extends Web3AuthError {
  name = "WalletConnectionError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 1001;
  }
}

export class WalletDisconnectedError extends Web3AuthError {
  name = "WalletDisconnectedError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 1002;
  }
}

export class WalletDisconnectionError extends Web3AuthError {
  name = "WalletDisconnectionError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 1003;
  }
}

export class WalletNotConnectedError extends Web3AuthError {
  name = "WalletNotConnectedError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 1004;
  }
}

/**
 * 11xx - Wallet transaction/signing/blockchain errors (can be displayed in UI)
 */
export class WalletSendTransactionError extends Web3AuthError {
  name = "WalletSendTransactionError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 1101;
  }
}

export class WalletSignMessageError extends Web3AuthError {
  name = "WalletSignMessageError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 1102;
  }
}

export class WalletSignTransactionError extends Web3AuthError {
  name = "WalletSignTransactionError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 1103;
  }
}

/**
 * 22xx - Wallet provider errors
 */
export class RpcConnectionFailedError extends Web3AuthError {
  name = "RpcConnectionFailedError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 2201;
  }
}

export class InvalidProviderConfigError extends Web3AuthError {
  name = "InvalidProviderConfigError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 2202;
  }
}

export class ProviderNotReadyError extends Web3AuthError {
  name = "ProviderNotReadyError";

  constructor(message?: string, error?: Error) {
    super(message, error);
    this.code = 2203;
  }
}
