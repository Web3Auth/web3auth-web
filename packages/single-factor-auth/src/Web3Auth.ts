import CustomAuth from "@toruslabs/customauth";
import { OpenloginSessionManager } from "@toruslabs/openlogin-session-manager";
import { subkey } from "@toruslabs/openlogin-subkey";
import { BrowserStorage } from "@toruslabs/openlogin-utils";
import {
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CustomChainConfig,
  SafeEventEmitterProvider,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { CommonPrivateKeyProvider, IBaseProvider } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";

import { IWeb3Auth, LoginParams, SessionData, Web3AuthOptions } from "./interface";

type PrivateKeyProvider = IBaseProvider<string>;

class Web3Auth implements IWeb3Auth {
  readonly options: Web3AuthOptions;

  public customAuthInstance: CustomAuth | null = null;

  private privKeyProvider: PrivateKeyProvider | null = null;

  private chainConfig: CustomChainConfig | null = null;

  private currentChainNamespace: ChainNamespaceType;

  private sessionManager!: OpenloginSessionManager<SessionData>;

  private currentStorage!: BrowserStorage;

  private readonly storageKey = "sfa_store";

  constructor(options: Web3AuthOptions) {
    if (!options?.chainConfig?.chainNamespace) {
      throw WalletInitializationError.invalidParams("Please provide a valid chainNamespace in chainConfig");
    }
    if (!options.clientId) throw WalletInitializationError.invalidParams("Please provide a valid clientId in constructor");

    if (options.chainConfig?.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      const { chainId, rpcTarget } = options?.chainConfig || {};
      if (!chainId) {
        throw WalletInitializationError.invalidProviderConfigError("Please provide chainId inside chainConfig");
      }
      if (!rpcTarget) {
        throw WalletInitializationError.invalidProviderConfigError("Please provide rpcTarget inside chainConfig");
      }

      this.chainConfig = {
        displayName: "",
        blockExplorer: "",
        ticker: "",
        tickerName: "",
        chainId: options.chainConfig.chainId as string,
        rpcTarget: options.chainConfig.rpcTarget as string,
        ...(options?.chainConfig || {}),
        chainNamespace: options.chainConfig.chainNamespace as ChainNamespaceType,
        decimals: 18,
      };
    }

    this.currentChainNamespace = options.chainConfig.chainNamespace;
    this.options = {
      ...options,
      web3AuthNetwork: options.web3AuthNetwork || "mainnet",
      sessionTime: options.sessionTime || 86400,
      storageServerUrl: options.storageServerUrl || "https://broadcast-server.tor.us",
      storageKey: options.storageKey || "local",
    };
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.privKeyProvider?.provider || null;
  }

  async init(): Promise<void> {
    this.currentStorage = BrowserStorage.getInstance(this.storageKey, this.options.storageKey);
    this.sessionManager = new OpenloginSessionManager({
      sessionServerBaseUrl: this.options.storageServerUrl,
      sessionTime: this.options.sessionTime,
    });
    this.customAuthInstance = new CustomAuth({
      enableOneKey: true,
      network: this.options.web3AuthNetwork,
      baseUrl: "https://web3auth.io",
      enableLogging: this.options.enableLogging,
    });

    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA && this.chainConfig) {
      this.privKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.EIP155 && this.chainConfig) {
      this.privKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });
    } else if (this.currentChainNamespace === CHAIN_NAMESPACES.OTHER) {
      this.privKeyProvider = new CommonPrivateKeyProvider();
    } else {
      throw WalletInitializationError.incompatibleChainNameSpace(
        `Invalid chainNamespace: ${this.currentChainNamespace} found while connecting to wallet`
      );
    }

    const sessionId = this.currentStorage.get<string>("sessionId");
    if (sessionId) {
      const data = await this.sessionManager.authorizeSession().catch(() => {});
      if (data && data.privKey) {
        const finalPrivKey = await this._getFinalPrivKey(data.privKey);
        await this.privKeyProvider.setupProvider(finalPrivKey);
      }
    }
  }

  /**
   * Use this function only with verifiers created on developer dashboard (https://dashboard.web3auth.io)
   * @param loginParams - Params used to login
   * @returns provider to connect
   */
  async connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null> {
    if (!this.customAuthInstance || !this.privKeyProvider || !this.currentStorage || !this.sessionManager)
      throw WalletInitializationError.notInstalled("Please call init first.");

    const { verifier, verifierId, idToken, subVerifierInfoArray } = loginParams;
    const verifierDetails = { verifier, verifierId };

    const { torusNodeEndpoints, torusNodePub } = await this.customAuthInstance.nodeDetailManager.getNodeDetails(verifierDetails);
    if (loginParams.serverTimeOffset) {
      this.customAuthInstance.torus.serverTimeOffset = loginParams.serverTimeOffset;
    }
    // does the key assign
    const pubDetails = await this.customAuthInstance.torus.getUserTypeAndAddress(torusNodeEndpoints, torusNodePub, verifierDetails, true);

    if (pubDetails.upgraded) {
      throw WalletLoginError.mfaEnabled();
    }

    if (pubDetails.typeOfUser === "v1") {
      // This shouldn't happen for this sdk.
      await this.customAuthInstance.torus.getOrSetNonce(pubDetails.X, pubDetails.Y);
    }

    let privKey = "";
    if (subVerifierInfoArray && subVerifierInfoArray?.length > 0) {
      const torusResponse = await this.customAuthInstance.getAggregateTorusKey(verifier, verifierId, subVerifierInfoArray);
      privKey = torusResponse.privateKey;
    } else {
      const torusResponse = await this.customAuthInstance.getTorusKey(verifier, verifierId, { verifier_id: verifierId }, idToken);
      privKey = torusResponse.privateKey;
    }

    if (!privKey) throw WalletLoginError.fromCode(5000, "Unable to get private key from torus nodes");

    const finalPrivKey = await this._getFinalPrivKey(privKey);
    await this.privKeyProvider.setupProvider(finalPrivKey);

    // set up the session in the storage server.
    const sessionId = OpenloginSessionManager.generateRandomSessionKey();
    // we are using the original private key so that we can retrieve other keys later on
    await this.sessionManager.createSession({ privKey });
    this.currentStorage.set("sessionId", sessionId);
    return this.provider;
  }

  async logout(): Promise<void> {
    const sessionId = this.currentStorage.get<string>("sessionId");
    if (!sessionId) throw WalletLoginError.userNotLoggedIn();

    await this.sessionManager.invalidateSession();
    this.currentStorage.set("sessionId", "");
  }

  private async _getFinalPrivKey(privKey: string) {
    let finalPrivKey = privKey.padStart(64, "0");
    if (this.currentChainNamespace === CHAIN_NAMESPACES.SOLANA) {
      const { getED25519Key } = await import("@toruslabs/openlogin-ed25519");
      finalPrivKey = getED25519Key(finalPrivKey).sk.toString("hex");
    }
    // get app scoped keys.
    if (this.options.usePnPKey) {
      const pnpPrivKey = subkey(finalPrivKey, Buffer.from(this.options.clientId, "base64"));
      finalPrivKey = pnpPrivKey.padStart(64, "0");
    }
    return finalPrivKey;
  }
}

export default Web3Auth;
