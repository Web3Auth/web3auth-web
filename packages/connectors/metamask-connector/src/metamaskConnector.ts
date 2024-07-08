/* eslint-disable @typescript-eslint/no-explicit-any */
import detectEthereumProvider from "@metamask/detect-provider";
import {
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
  ConnectorInitOptions,
  ConnectorNamespaceType,
  CustomChainConfig,
  IProvider,
  log,
  UserInfo,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthError,
} from "@web3auth/base";
import { BaseEvmConnector } from "@web3auth/base-evm-connector";

interface EthereumProvider extends IProvider {
  isMetaMask?: boolean;
  isConnected: () => boolean;
  chainId: string;
}
export type MetamaskConnectorOptions = BaseConnectorSettings;

export class MetamaskConnector extends BaseEvmConnector<void> {
  readonly connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  readonly name: string = WALLET_CONNECTORS.METAMASK;

  public status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private metamaskProvider: EthereumProvider | null = null;

  get provider(): IProvider | null {
    if (this.status !== CONNECTOR_STATUS.NOT_READY && this.metamaskProvider) {
      return this.metamaskProvider;
    }
    return null;
  }

  set provider(_: IProvider | null) {
    throw new Error("Not implemented");
  }

  async init(options: ConnectorInitOptions = {}): Promise<void> {
    await super.init(options);
    super.checkInitializationRequirements();
    this.metamaskProvider = (await detectEthereumProvider({ mustBeMetaMask: true, silent: true, timeout: 1000 })) as EthereumProvider;
    if (!this.metamaskProvider) throw WalletInitializationError.notInstalled("Metamask extension is not installed");
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.READY, WALLET_CONNECTORS.METAMASK);
    try {
      log.debug("initializing metamask adapter");
      if (options.autoConnect) {
        this.rehydrated = true;
        await this.connect();
      }
    } catch (error) {
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<IProvider | null> {
    super.checkConnectionRequirements();
    if (!this.metamaskProvider) throw WalletLoginError.notConnectedError("Not able to connect with metamask");
    const { ethereum } = window as any;
    const isPhantom = Boolean("isPhantom" in ethereum);
    // check which is the active provider
    if (ethereum && ethereum.isMetaMask && isPhantom) {
      // this means phantom is the active provider.
      if (ethereum.providers && ethereum.providers.length > 0) {
        const provider = ethereum.providers.find((p: any) => p.isMetaMask && !p.overrideIsMetaMask);

        if (provider) {
          ethereum.setProvider(provider);
        }
      }
    } else if (ethereum && (ethereum.providers || []).length > 0) {
      // this means that there are another providers than metamask (like coinbase).
      const provider = ethereum.providers.find((p: any) => p.isMetaMask);
      if (provider) {
        ethereum.setSelectedProvider(provider);
      }
    }

    this.status = CONNECTOR_STATUS.CONNECTING;
    this.emit(CONNECTOR_EVENTS.CONNECTING, { adapter: WALLET_CONNECTORS.METAMASK });
    try {
      await this.metamaskProvider.request({ method: "eth_requestAccounts" });
      const { chainId } = this.metamaskProvider;
      if (chainId !== this.chainConfig.id.toString(16)) {
        await this.addChain(this.chainConfig as CustomChainConfig, true);
        await this.switchChain({ chainId: this.chainConfig.id }, true);
      }
      this.status = CONNECTOR_STATUS.CONNECTED;
      if (!this.provider) throw WalletLoginError.notConnectedError("Failed to connect with provider");
      const disconnectHandler = () => {
        // ready to be connected again
        this.disconnect();
        this.provider?.removeListener("disconnect", disconnectHandler);
      };
      this.provider.on("disconnect", disconnectHandler);
      this.emit(CONNECTOR_EVENTS.CONNECTED, {
        connector: WALLET_CONNECTORS.METAMASK,
        reconnected: this.rehydrated,
        provider: this.provider,
      } as CONNECTED_EVENT_DATA);
      return this.provider;
    } catch (error) {
      // ready again to be connected
      this.status = CONNECTOR_STATUS.READY;
      this.rehydrated = false;
      this.emit(CONNECTOR_EVENTS.ERRORED, error);
      if (error instanceof Web3AuthError) throw error;
      throw WalletLoginError.connectionError("Failed to login with metamask wallet");
    }
  }

  async disconnect(options: { cleanup: boolean } = { cleanup: false }): Promise<void> {
    await super.disconnectSession();
    this.provider?.removeAllListeners();
    if (options.cleanup) {
      this.status = CONNECTOR_STATUS.NOT_READY;
      this.metamaskProvider = null;
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

  public async addChain(chainConfig: CustomChainConfig, init = false): Promise<void> {
    super.checkAddChainRequirements(chainConfig, init);
    await this.metamaskProvider?.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainConfig.id,
          chainName: chainConfig.name,
          rpcUrls: [chainConfig.rpcUrls.default.http[0]],
          blockExplorerUrls: [chainConfig.blockExplorers?.default?.url],
          nativeCurrency: chainConfig.nativeCurrency,
          iconUrls: [chainConfig.logo],
        },
      ],
    });
    this.addChainConfig(chainConfig);
  }

  public async switchChain(params: { chainId: number }, init = false): Promise<void> {
    super.checkSwitchChainRequirements(params, init);
    await this.metamaskProvider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: params.chainId.toString(16) }],
    });
    this.setConnectorSettings({ chainConfig: this.getChainConfig(params.chainId) as CustomChainConfig });
  }

  public async enableMFA(): Promise<void> {
    throw new Error("Method Not implemented");
  }
}
