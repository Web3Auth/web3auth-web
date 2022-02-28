import { ErrorCodes, IWeb3AuthError, Web3AuthError } from "@web3auth/base";

export class TorusWalletPluginError extends Web3AuthError {
  protected static messages: ErrorCodes = {
    5210: "Torus Wallet Plugin is not initialized",
    5211: "Web3Auth is connected to unsupported adapter. Torus wallet connector plugin requires web3auth connected to openlogin adapter.",
    5212: "Torus Wallet Plugin requires a provider to be set in the contructor.",
    5213: "Torus Wallet Plugin requires a provider or web3Auth instance passed in the constructor",
    5214: "Web3Auth is not connected.",
    5215: "Torus Wallet Plugin requires a userInfo object passed along with the provider in the constructor.",
  };

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "TorusWalletPluginError" });
  }

  public static fromCode(code: number, extraMessage = ""): IWeb3AuthError {
    return new TorusWalletPluginError(code, `${TorusWalletPluginError.messages[code]}${extraMessage}`);
  }

  public static notInitialized(extraMessage = ""): IWeb3AuthError {
    return TorusWalletPluginError.fromCode(5210, extraMessage);
  }

  public static unsupportedAdapter(extraMessage = ""): IWeb3AuthError {
    return TorusWalletPluginError.fromCode(5211, extraMessage);
  }

  public static providerRequired(extraMessage = ""): IWeb3AuthError {
    return TorusWalletPluginError.fromCode(5212, extraMessage);
  }

  public static providerOrWeb3AuthRequired(extraMessage = ""): IWeb3AuthError {
    return TorusWalletPluginError.fromCode(5213, extraMessage);
  }

  public static web3AuthNotConnected(extraMessage = ""): IWeb3AuthError {
    return TorusWalletPluginError.fromCode(5214, extraMessage);
  }

  public static userInfoRequired(extraMessage = ""): IWeb3AuthError {
    return TorusWalletPluginError.fromCode(5215, extraMessage);
  }
}
