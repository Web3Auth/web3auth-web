import { StatusAPIResponse } from "@farcaster/auth-client";
import OpenLogin from "@toruslabs/openlogin";
import { LoginParams } from "@toruslabs/openlogin-utils";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_EVENTS,
  ADAPTER_NAMESPACES,
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  AdapterInitOptions,
  AdapterNamespaceType,
  BaseAdapterSettings,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CustomChainConfig,
  IProvider,
  log,
  UserInfo,
  WALLET_ADAPTERS,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { BaseEvmAdapter } from "@web3auth/base-evm-adapter";
import { FarcasterAuthClientProvider } from "@web3auth/ethereum-provider";

import { getFarcasterDefaultOptions } from "./config";
import {
  FarcasterAdapterOptions,
  FarcasterAdapterSettings,
  FarcasterLoginParams,
  FarcasterVerifyResult,
  LoginSettings,
  PrivateKeyProvider,
} from "./interface";
import { getSiwfNonce, verifyFarcasterLogin } from "./siwf";

export class FarcasterAdapter extends BaseEvmAdapter<LoginParams> {
  readonly adapterNamespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly name: string = WALLET_ADAPTERS.FARCASTER;

  public status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  public openLoginInstance: OpenLogin | null = null;

  public fcProvider: FarcasterAuthClientProvider | null = null;

  public userInfo: Partial<UserInfo> = {};

  public privateKeyProvider: PrivateKeyProvider | null = null;

  public loginSettings: LoginSettings = { loginProvider: "" };

  private farcasterAdapterSettings: FarcasterAdapterOptions["adapterSettings"];

  constructor(params: FarcasterAdapterOptions) {
    super(params);
    this.setAdapterSettings({
      ...params.adapterSettings,
      chainConfig: params.chainConfig,
      clientId: params.clientId || "",
      sessionTime: params.sessionTime,
      web3AuthNetwork: params.web3AuthNetwork,
      useCoreKitKey: params.useCoreKitKey,
    });
    this.loginSettings = params.loginSettings;
    this.privateKeyProvider = params.privateKeyProvider;
  }

  get provider(): IProvider | null {
    if (this.status !== ADAPTER_STATUS.NOT_READY && this.privateKeyProvider) {
      return this.privateKeyProvider;
    }
    return null;
  }

  async init(options: AdapterInitOptions): Promise<void> {
    log.debug("initializing farcaster adapter");
    super.init(options);
    super.checkInitializationRequirements();

    if (!this.clientId) throw WalletInitializationError.invalidParams("clientId is required before openlogin's initialization");
    if (!this.farcasterAdapterSettings) throw WalletInitializationError.invalidParams("openloginOptions is required before adapter's initialization");
    if (!this.privateKeyProvider) throw WalletInitializationError.invalidParams("privateKeyProvider is required before adapter's initialization");

    this.openLoginInstance = new OpenLogin({
      clientId: this.clientId,
      network: this.web3AuthNetwork,
      loginConfig: {
        jwt: {
          name: "Farcaster Login",
          verifier: this.farcasterAdapterSettings.verifier,
          typeOfLogin: "jwt",
          clientId: this.clientId,
        },
      },
    });

    await this.openLoginInstance.init();

    this.fcProvider = new FarcasterAuthClientProvider({ config: { chainConfig: this.chainConfig } });

    this.status = ADAPTER_STATUS.READY;
    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.FARCASTER);

    try {
      log.debug("initializing openlogin adapter");

      const finalPrivKey = this._getFinalPrivKey();
      // connect only if it is redirect result or if connect (adapter is cached/already connected in same session) is true
      if (finalPrivKey && options.autoConnect) {
        this.rehydrated = true;
        if (finalPrivKey) {
          await this.privateKeyProvider.setupProvider(finalPrivKey);
          this.status = ADAPTER_STATUS.CONNECTED;
          this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.FARCASTER, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
        }
      }
    } catch (error) {
      log.error("Failed to connect with cached openlogin provider", error);
      this.emit("ERRORED", error);
    }
  }

  async connect(params: FarcasterLoginParams = {}): Promise<IProvider> {
    super.checkConnectionRequirements();
    if (!this.fcProvider) throw new Error("Not able to connect to farcaster");

    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { ...params, adapter: WALLET_ADAPTERS.FARCASTER });

    const { data: userFarcasterData, sessionId } = await this.loginWithFarcaster();
    const verifyResponse = await this.verifyLogin(userFarcasterData, sessionId);
    log.debug("verifyResponse", verifyResponse);

    if (verifyResponse.token) {
      await this.connectWithW3A(params, verifyResponse.token);
    } else {
      // TODO: any way to propagate this error to modal
      // and show a restart button
      const error = new Error("unable to verify farcaster login.");
      this.emit("ERRORED", error);
      throw new Error("Failed to fetch token from siwe server after signature validation");
    }

    this.status = ADAPTER_STATUS.CONNECTED;
    this.emit(ADAPTER_STATUS.CONNECTED, { adapter: WALLET_ADAPTERS.FARCASTER });
    return this.provider;
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    this.fcProvider?.removeAllListeners();
    if (options.cleanup) {
      this.status = ADAPTER_STATUS.NOT_READY;
      this.fcProvider = null;
    } else {
      this.status = ADAPTER_STATUS.READY;
    }
    await super.disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) {
      throw new Error("Noted connected with farcaster. Please login/connect first");
    }
    log.debug("farcasterAdapter::getUserInfo", this.fcProvider.status);
    return this.fcProvider.status as Partial<UserInfo>;
  }

  addChain(_chainConfig: CustomChainConfig): Promise<void> {
    throw new Error("Method not implemented.");
  }

  switchChain(_params: { chainId: string }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // should be called only before initialization.
  setAdapterSettings(adapterSettings: Partial<FarcasterAdapterSettings & BaseAdapterSettings>): void {
    super.setAdapterSettings(adapterSettings);
    const defaultOptions = getFarcasterDefaultOptions();
    log.info("setting adapter settings", adapterSettings);
    this.farcasterAdapterSettings = {
      ...defaultOptions,
      ...adapterSettings,
    };
  }

  private async loginWithFarcaster(): Promise<{
    data: StatusAPIResponse;
    sessionId: string;
  }> {
    const { domain, siweServer, siweUri, requestId, notBefore, expirationTime } = this.farcasterAdapterSettings;
    const sessionId = requestId || Math.random().toString(36).slice(2);
    const verificationStartTime = notBefore ? new Date(notBefore) : new Date();
    const verificationExpiryTime = expirationTime
      ? new Date(expirationTime)
      : new Date(verificationStartTime.setMinutes(verificationStartTime.getMinutes() + 5));

    const nonce = await getSiwfNonce(siweServer, {
      sessionId,
      domain,
      expirationTime: verificationExpiryTime.toISOString(),
    });

    // create channel
    const chanResponse = await this.fcProvider.createChannel({
      siweUri,
      domain,
      nonce,
    });

    log.debug("farcaster channel response", chanResponse, siweUri, domain, nonce);
    if (chanResponse.url) {
      this.updateAdapterData({ farcasterConnectUri: chanResponse.url, farcasterLogin: true });
    }

    // get status from login
    const fcStatus = await this.fcProvider.watchStatus({ channelToken: chanResponse.channelToken });
    log.debug("status", fcStatus);
    if (fcStatus.error) {
      // TODO: any way to propagate this error to modal
      // and show a restart button
      this.emit("ERRORED", fcStatus.error);
      throw fcStatus.error;
    } else if (fcStatus.data) {
      return {
        data: fcStatus.data,
        sessionId,
      };
    }
    // TODO: any way to propagate this error to modal
    // and show a restart button
    this.emit("ERRORED", new Error("Unknown error, failed to fetch user's profile data from farcaster login"));
    throw new Error("Unknown error, failed to fetch user's profile data from farcaster login");
  }

  private async connectWithW3A(params: FarcasterLoginParams, jwtToken: string) {
    if (!this.privateKeyProvider) throw WalletInitializationError.invalidParams("privateKeyProvider is required before initialization");
    if (!this.openLoginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");

    const keyAvailable = this._getFinalPrivKey();
    // if not logged in then login
    if (!keyAvailable) {
      // TODO: integrate sfa sdk here if possible.
      // login with openlogin sdk
      const openLoginParams = {
        ...params,
        loginProvider: "jwt",
        extraLoginOptions: {
          ...params.extraLoginOptions,
          id_token: jwtToken,
          verifierIdField: "sub",
        },
      };
      await this.openLoginInstance.login(openLoginParams);
    }
    const finalPrivKey = this._getFinalPrivKey();
    if (finalPrivKey) {
      await this.privateKeyProvider.setupProvider(finalPrivKey);
      this.status = ADAPTER_STATUS.CONNECTED;
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.FARCASTER, reconnected: this.rehydrated } as CONNECTED_EVENT_DATA);
    } else {
      throw WalletLoginError.notConnectedError("Unable to fetch private key after login");
    }
  }

  private async verifyLogin(args: StatusAPIResponse, sessionId: string): Promise<FarcasterVerifyResult> {
    const { domain, siweServer } = this.farcasterAdapterSettings;
    const res = await verifyFarcasterLogin(
      siweServer,
      {
        nonce: args.nonce,
        sessionId,
        message: args.message,
        domain,
        signature: args.signature,
        issuer: this.name,
        timeout: this.sessionTime,
      },
      this.clientId,
      this.web3AuthNetwork
    );
    return res;
  }

  private _getFinalPrivKey() {
    if (!this.openLoginInstance) return "";
    let finalPrivKey = this.openLoginInstance.privKey;
    // coreKitKey is available only for custom verifiers by default
    if (this.useCoreKitKey) {
      // this is to check if the user has already logged in but coreKitKey is not available.
      // when useCoreKitKey is set to true.
      // This is to ensure that when there is no user session active, we don't throw an exception.
      if (this.openLoginInstance.privKey && !this.openLoginInstance.coreKitKey) {
        throw WalletLoginError.coreKitKeyNotFound();
      }
      finalPrivKey = this.openLoginInstance.coreKitKey;
    }
    return finalPrivKey;
  }
}
