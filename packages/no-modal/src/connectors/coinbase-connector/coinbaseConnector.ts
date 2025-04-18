import type { AppMetadata, Preference, ProviderInterface } from "@coinbase/wallet-sdk";

import {
  BaseConnectorLoginParams,
  BaseConnectorSettings,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTED_EVENT_DATA,
  CONNECTOR_CATEGORY,
  CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  CONNECTOR_STATUS_TYPE,
  ConnectorFn,
  ConnectorInitOptions,
  ConnectorNamespaceType,
  ConnectorParams,
  IProvider,
  UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletLoginError,
  Web3AuthError,
} from "@/core/base";

import { BaseEvmConnector } from "../base-evm-connector";

export type CoinbaseWalletSDKOptions = Partial<AppMetadata & Preference>;

export interface CoinbaseConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: CoinbaseWalletSDKOptions;
}

class CoinbaseConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: WALLET_CONNECTOR_TYPE = WALLET_CONNECTORS.COINBASE;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private coinbaseProvider: ProviderInterface | null = null;

  private coinbaseOptions: CoinbaseWalletSDKOptions = { appName: "Web3Auth" };

  constructor(connectorOptions: CoinbaseConnectorOptions) {
    super(connectorOptions);
    this.coinbaseOptions = { ...this.coinbaseOptions, ...connectorOptions.connectorSettings };
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.coinbaseProvider) {
      return this.coinbaseProvider as unknown as IProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions): Promise<void> {
    await super.init(options);
    const chainConfig = this.coreOptions.chains.find((x) => x.chainId === options.chainId);
    super.checkInitializationRequirements({ chainConfig });
    const { createCoinbaseWalletSDK } = await import("@coinbase/wallet-sdk");

    const coinbaseInstance = createCoinbaseWalletSDK({
      ...this.coinbaseOptions,
      preference: { options: this.coinbaseOptions.options || "smartWalletOnly" },
      appChainIds: this.coreOptions.chains.map((x) => Number.parseInt(x.chainId, 16)),
      appName: this.coinbaseOptions.appName || "Web3Auth",
      appLogoUrl: this.coinbaseOptions.appLogoUrl || "",
    });
    this.coinbaseProvider = coinbaseInstance.getProvider();
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.COINBASE);
    try {
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect({ chainId: options.chainId });
      }
    } catch (error) {
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
    }
  }

  async connect({ chainId }: BaseConnectorLoginParams): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.coinbaseProvider) throw WalletLoginError.notConnectedError("Connector is not initialized");
    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.COINBASE });
    try {
      const chainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
      if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

      await this.coinbaseProvider.request({ method: "eth_requestAccounts" });
      const currentChainId = (await this.coinbaseProvider.request({ method: "eth_chainId" })) as string;
      if (currentChainId !== chainConfig.chainId) {
        await this.switchChain(chainConfig, true);
      }
      this.status = CONNECTOR_STATUS.CONNECTED;
      if (!this.provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");
      this.provider.once("disconnect", () => {
        // ready to be connected again
        this.disconnect();
      });
      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.COINBASE,
        reconnected: this.rehydrated,
        provider: this.provider,
      } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error) {
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = false;
      this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
      if (error instanceof Web3AuthError) throw error;
      throw WalletLoginError.connectionError("Failed to login with coinbase wallet", error);
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    this.provider?.removeAllListeners();
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.coinbaseProvider = null;
    } else {
      // ready to be connected again
      this.status = CONNECTOR_STATUS.READY;
    }
    await super.disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.coinbaseProvider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: params.chainId }] });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async manageMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}

export const coinbaseConnector = (params?: CoinbaseWalletSDKOptions): ConnectorFn => {
  return ({ coreOptions }: ConnectorParams) => {
    return new CoinbaseConnector({
      connectorSettings: params,
      coreOptions,
    });
  };
};
