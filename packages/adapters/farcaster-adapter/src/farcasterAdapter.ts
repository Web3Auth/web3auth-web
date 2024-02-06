import { StatusAPIResponse } from "@farcaster/auth-client";
import OpenLogin from "@toruslabs/openlogin";
import { LoginParams, OPENLOGIN_NETWORK, OpenLoginOptions } from "@toruslabs/openlogin-utils";
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
  CustomChainConfig,
  FarcasterVerifyResult,
  IProvider,
  log,
  UserInfo,
  verifyFarcasterLogin,
  WALLET_ADAPTERS,
  WalletInitializationError,
} from "@web3auth/base";
import { BaseEvmAdapter } from "@web3auth/base-evm-adapter";
import { FarcasterAuthClientProvider } from "@web3auth/ethereum-provider";

import { getOpenloginDefaultOptions } from "./config";
import { FarcasterAdapterOptions, LoginSettings, PrivateKeyProvider } from "./interface";

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

  private openloginOptions: FarcasterAdapterOptions["adapterSettings"];

  constructor(params: FarcasterAdapterOptions) {
    super(params);
    this.setAdapterSettings({
      ...params.adapterSettings,
      chainConfig: params.chainConfig,
      clientId: params.clientId || "",
      sessionTime: params.sessionTime,
      web3AuthNetwork: params.web3AuthNetwork,
      useCoreKitKey: params.useCoreKitKey,
      privateKeyProvider: params.privateKeyProvider,
    });
    this.loginSettings = params.loginSettings || { loginProvider: "" };
    this.privateKeyProvider = params.privateKeyProvider || null;
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
    if (!this.openloginOptions) throw WalletInitializationError.invalidParams("openloginOptions is required before openlogin's initialization");

    this.fcProvider = new FarcasterAuthClientProvider({ config: { chainConfig: this.chainConfig } });

    this.emit(ADAPTER_EVENTS.READY, WALLET_ADAPTERS.FARCASTER);
    this.status = ADAPTER_STATUS.READY;
  }

  async connect(params: LoginParams): Promise<IProvider> {
    super.checkConnectionRequirements();
    if (!this.fcProvider) throw new Error("Not able to connect to farcaster");

    this.status = ADAPTER_STATUS.CONNECTING;
    this.emit(ADAPTER_EVENTS.CONNECTING, { ...params, adapter: WALLET_ADAPTERS.FARCASTER });

    this.openLoginInstance = new OpenLogin({
      ...this.openloginOptions,
      clientId: this.clientId,
      network: this.openloginOptions.network || this.web3AuthNetwork || OPENLOGIN_NETWORK.SAPPHIRE_MAINNET,
    });

    // create channel
    const chanResponse = await this.fcProvider.createChannel({
      siweUri: "https://example.com/login",
      domain: "example.com",
    });

    log.debug("farcaster channel response", chanResponse);
    if (chanResponse.url) {
      this.updateAdapterData({ farcasterConnectUri: chanResponse.url, farcasterLogin: true });
    }

    // get status from login
    const fcStatus = await this.fcProvider.watchStatus({ channelToken: chanResponse.channelToken });
    log.debug("status", fcStatus);

    if (!fcStatus.error && !fcStatus.isError && fcStatus.data) {
      const verifyResponse = await this.verifyLogin(fcStatus.data, "example.com");
      log.debug("verifyResponse", verifyResponse);
    } else {
      throw new Error(`error connecting to farcaster: ${fcStatus.error}`);
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
  setAdapterSettings(adapterSettings: Partial<OpenLoginOptions & BaseAdapterSettings> & { privateKeyProvider?: PrivateKeyProvider }): void {
    super.setAdapterSettings(adapterSettings);
    const defaultOptions = getOpenloginDefaultOptions();
    log.info("setting adapter settings", adapterSettings);
    this.openloginOptions = {
      ...defaultOptions.adapterSettings,
      ...this.openloginOptions,
      ...adapterSettings,
    };
    if (adapterSettings.web3AuthNetwork) {
      this.openloginOptions.network = adapterSettings.web3AuthNetwork;
    }
    if (adapterSettings.privateKeyProvider) {
      this.privateKeyProvider = adapterSettings.privateKeyProvider;
    }
  }

  private async verifyLogin(args: StatusAPIResponse, domain: string): Promise<FarcasterVerifyResult> {
    const res = await verifyFarcasterLogin(
      args.nonce,
      args.message,
      args.signature,
      domain,
      this.name,
      this.sessionTime,
      this.clientId,
      this.web3AuthNetwork
    );
    return res;
  }
}
