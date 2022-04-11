import { ErrorCodes, IWeb3AuthError, Web3AuthError } from "@web3auth/base";

export class SolanaWalletPluginError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5210: "Torus Wallet Plugin is not initialized",
    5211: "Web3Auth is connected to unsupported adapter. Torus wallet connector plugin requires web3auth connected to openlogin adapter.",
    5212: "Provider is required..",
    5213: "Web3Auth instance is required while initialization.",
    5214: "Web3Auth is not connected.",
    5215: "UserInfo is required.",
    5216: "Plugin is already initialized",
    5217: "Torus wallet instance is not set.",
  };

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "SolanaWalletPluginError" });
  }

  public static fromCode(code: number, extraMessage = ""): IWeb3AuthError {
    return new SolanaWalletPluginError(code, `${SolanaWalletPluginError.messages[code]}${extraMessage}`);
  }

  public static notInitialized(extraMessage = ""): IWeb3AuthError {
    return SolanaWalletPluginError.fromCode(5210, extraMessage);
  }

  public static unsupportedAdapter(extraMessage = ""): IWeb3AuthError {
    return SolanaWalletPluginError.fromCode(5211, extraMessage);
  }

  public static providerRequired(extraMessage = ""): IWeb3AuthError {
    return SolanaWalletPluginError.fromCode(5212, extraMessage);
  }

  public static web3authRequired(extraMessage = ""): IWeb3AuthError {
    return SolanaWalletPluginError.fromCode(5213, extraMessage);
  }

  public static web3AuthNotConnected(extraMessage = ""): IWeb3AuthError {
    return SolanaWalletPluginError.fromCode(5214, extraMessage);
  }

  public static userInfoRequired(extraMessage = ""): IWeb3AuthError {
    return SolanaWalletPluginError.fromCode(5215, extraMessage);
  }

  public static alreadyInitialized(extraMessage = ""): IWeb3AuthError {
    return SolanaWalletPluginError.fromCode(5216, extraMessage);
  }

  public static torusWalletNotSet(extraMessage = ""): IWeb3AuthError {
    return SolanaWalletPluginError.fromCode(5217, extraMessage);
  }
}
