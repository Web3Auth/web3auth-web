import { ErrorCodes, IWeb3AuthError, Web3AuthError } from "@web3auth/base";

export class WalletServicesPluginError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5210: "Wallet Services Plugin is not initialized",
    5211: "Web3Auth is connected to unsupported adapter. Wallet services connector plugin requires web3auth connected to openlogin adapter.",
    5212: "Provider is required..",
    5213: "Web3Auth instance is required while initialization.",
    5214: "Web3Auth is not connected.",
    5216: "Plugin is already initialized",
    5218: "Unsupported chain namespace.",
    5219: "Plugin network different than web3auth instance network.",
  };

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "WalletServicesPluginError" });
  }

  public static fromCode(code: number, extraMessage = ""): IWeb3AuthError {
    return new WalletServicesPluginError(code, `${WalletServicesPluginError.messages[code]}${extraMessage}`);
  }

  public static notInitialized(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5210, extraMessage);
  }

  public static unsupportedAdapter(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5211, extraMessage);
  }

  public static providerRequired(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5212, extraMessage);
  }

  public static web3authRequired(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5213, extraMessage);
  }

  public static web3AuthNotConnected(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5214, extraMessage);
  }

  public static alreadyInitialized(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5216, extraMessage);
  }

  public static unsupportedChainNamespace(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5218, extraMessage);
  }

  public static differentWeb3authNetwork(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5219, extraMessage);
  }

  public static invalidParams(extraMessage = ""): IWeb3AuthError {
    return WalletServicesPluginError.fromCode(5220, extraMessage);
  }
}
