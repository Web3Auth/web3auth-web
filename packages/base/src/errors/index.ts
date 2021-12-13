export class WalletError extends Error {
  public error: any;

  public code: number;

  constructor(message?: string, error?: any) {
    super(message);
    this.error = error;
  }
}

/**
 * 20XX - wallet login errors
 */
export class WalletNotFoundError extends WalletError {
  name = "WalletNotFoundError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2001;
  }
}

export class WalletNotInstalledError extends WalletError {
  name = "WalletNotInstalledError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2002;
  }
}

export class WalletNotReadyError extends WalletError {
  name = "WalletNotReadyError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2003;
  }
}

export class WalletWindowBlockedError extends WalletError {
  name = "WalletWindowBlockedError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2004;
  }
}

export class WalletWindowClosedError extends WalletError {
  name = "WalletWindowClosedError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2005;
  }
}

export class IncompatibleChainNamespaceError extends WalletError {
  name = "IncompatibleChainNamespaceError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2006;
  }
}

export class DuplicateWalletAdapterError extends WalletError {
  name = "DuplicateWalletAdapterError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2007;
  }
}

/**
 * 20XX - wallet account/keys errors
 */
export class WalletAccountError extends WalletError {
  name = "WalletAccountError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2101;
  }
}

export class WalletPublicKeyError extends WalletError {
  name = "WalletPublicKeyError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2102;
  }
}

export class WalletKeypairError extends WalletError {
  name = "WalletKeypairError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2103;
  }
}

/**
 * 10XX - wallet adapter errors (can be displayed in UI)
 */
export class WalletConnectionError extends WalletError {
  name = "WalletConnectionError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 1001;
  }
}

export class WalletDisconnectedError extends WalletError {
  name = "WalletDisconnectedError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 1002;
  }
}

export class WalletDisconnectionError extends WalletError {
  name = "WalletDisconnectionError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 1003;
  }
}

export class WalletNotConnectedError extends WalletError {
  name = "WalletNotConnectedError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 1004;
  }
}

/**
 * 11xx - Wallet transaction/signing/blockchain errors (can be displayed in UI)
 */
export class WalletSendTransactionError extends WalletError {
  name = "WalletSendTransactionError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 1101;
  }
}

export class WalletSignMessageError extends WalletError {
  name = "WalletSignMessageError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 1102;
  }
}

export class WalletSignTransactionError extends WalletError {
  name = "WalletSignTransactionError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 1103;
  }
}

/**
 * 22xx - Wallet provider errors
 */
export class RpcConnectionFailedError extends WalletError {
  name = "RpcConnectionFailedError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2201;
  }
}

export class InvalidProviderConfigError extends WalletError {
  name = "InvalidProviderConfigError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2202;
  }
}

export class ProviderNotReadyError extends WalletError {
  name = "ProviderNotReadyError";

  constructor(message?: string, error?: any) {
    super(message, error);
    this.code = 2203;
  }
}
