import type { AppMetadata, Preference } from "@base-org/account";

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
  IdentityTokenInfo,
  IProvider,
  UserInfo,
  WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletLoginError,
  Web3AuthError,
} from "../../base";
import { BaseEvmConnector } from "../base-evm-connector";
import { getSiteIcon, getSiteName } from "../utils";

export type BaseAccountSDKOptions = Partial<AppMetadata & { preference?: Preference; paymasterUrls?: Record<number, string> }>;

export interface BaseAccountConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: BaseAccountSDKOptions;
}

interface BaseAccountProvider {
  request<T>(args: { method: string; params?: unknown[] }): Promise<T>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  once(event: string, listener: (...args: unknown[]) => void): void;
  removeAllListeners(): void;
}

interface ProviderRpcError extends Error {
  code: number;
}

class BaseAccountConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: WALLET_CONNECTOR_TYPE = WALLET_CONNECTORS.BASE_ACCOUNT;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private baseAccountProvider: BaseAccountProvider | null = null;

  private baseAccountOptions: BaseAccountSDKOptions = { appName: "Web3Auth" };

  constructor(connectorOptions: BaseAccountConnectorOptions) {
    super(connectorOptions);
    this.baseAccountOptions = { ...this.baseAccountOptions, ...connectorOptions.connectorSettings };
  }

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.baseAccountProvider) {
      return this.baseAccountProvider as unknown as IProvider;
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

    const { createBaseAccountSDK } = await import("@base-org/account");

    // Derive defaults from site metadata if available
    let appName = this.baseAccountOptions.appName || "Web3Auth";
    let appLogoUrl = this.baseAccountOptions.appLogoUrl || "";

    if (typeof window !== "undefined") {
      if (!this.baseAccountOptions.appName) {
        appName = getSiteName(window) || "Web3Auth";
      }
      if (!this.baseAccountOptions.appLogoUrl) {
        appLogoUrl = (await getSiteIcon(window)) || "";
      }
    }

    // Derive appChainIds from all EIP155 chains
    const appChainIds = this.coreOptions.chains
      .filter((x) => x.chainNamespace === CHAIN_NAMESPACES.EIP155)
      .map((x) => Number.parseInt(x.chainId, 16));

    const sdk = createBaseAccountSDK({
      ...this.baseAccountOptions,
      appName,
      appLogoUrl: appLogoUrl || null,
      appChainIds: this.baseAccountOptions.appChainIds || appChainIds,
    });

    this.baseAccountProvider = sdk.getProvider() as unknown as BaseAccountProvider;
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.BASE_ACCOUNT);

    try {
      if (options.autoConnect) {
        this.rehydrated = true;
        const provider = await this.connect({ chainId: options.chainId, getIdentityToken: options.getIdentityToken });
        if (!provider) {
          this.rehydrated = false;
          throw WalletLoginError.connectionError("Failed to rehydrate.");
        }
      }
    } catch (error) {
      this.emit(CONNECTOR_EVENTS.REHYDRATION_ERROR, error as Web3AuthError);
    }
  }

  async connect({ chainId, getIdentityToken }: BaseConnectorLoginParams): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.baseAccountProvider) throw WalletLoginError.notConnectedError("Connector is not initialized");

    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { connector: WALLET_CONNECTORS.BASE_ACCOUNT });

    try {
      const chainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
      if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");

      await this.baseAccountProvider.request({ method: "eth_requestAccounts" });
      const currentChainId = await this.baseAccountProvider.request<string>({ method: "eth_chainId" });

      if (currentChainId !== chainConfig.chainId) {
        await this.switchChain(chainConfig, true);
      }

      this.status = CONNECTOR_STATUS.CONNECTED;
      if (!this.provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");

      this.provider.once("disconnect", () => {
        this.disconnect();
      });

      let identityTokenInfo: IdentityTokenInfo | undefined;

      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.BASE_ACCOUNT,
        reconnected: this.rehydrated,
        provider: this.provider,
        identityTokenInfo,
      } as CONNECTED_EVENT_DATA);

      if (getIdentityToken) {
        identityTokenInfo = await this.getIdentityToken();
      }

      return this.provider;
    } catch (error) {
      this.status = CONNECTOR_STATUS.READY;
      if (!this.rehydrated) this.emit(CONNECTOR_EVENTS.ERRORED, error as Web3AuthError);
      this.rehydrated = false;
      if (error instanceof Web3AuthError) throw error;
      throw WalletLoginError.connectionError("Failed to login with Base Account", error);
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    this.provider?.removeAllListeners();
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.baseAccountProvider = null;
    } else {
      this.status = CONNECTOR_STATUS.READY;
    }
    await super.disconnect();
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.canAuthorize) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  public async switchChain(params: { chainId: string }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    try {
      await this.baseAccountProvider?.request({ method: "wallet_switchEthereumChain", params: [{ chainId: params.chainId }] });
    } catch (switchError: unknown) {
      if ((switchError as ProviderRpcError).code === 4902) {
        const chainConfig = this.coreOptions.chains.find((x) => x.chainId === params.chainId);
        if (!chainConfig) throw WalletLoginError.connectionError("Chain config is not available");
        await this.baseAccountProvider?.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainConfig.chainId,
              rpcUrls: [chainConfig.rpcTarget],
              chainName: chainConfig.displayName,
              nativeCurrency: { name: chainConfig.tickerName, symbol: chainConfig.ticker, decimals: chainConfig.decimals || 18 },
              blockExplorerUrls: [chainConfig.blockExplorerUrl],
              iconUrls: [chainConfig.logo],
            },
          ],
        });
        return;
      }
      throw switchError;
    }
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }

  public async manageMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}

export const baseAccountConnector = (params?: BaseAccountSDKOptions): ConnectorFn => {
  return ({ coreOptions }: ConnectorParams) => {
    return new BaseAccountConnector({
      connectorSettings: params,
      coreOptions,
    });
  };
};
