import { type BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { SafeEventEmitter, type WhiteLabelData } from "@web3auth/auth";
import WsEmbed from "@web3auth/ws-embed";

import { AuthAdapter } from "@/core/auth-adapter";
import {
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  EVM_PLUGINS,
  IPlugin,
  IProvider,
  IWeb3AuthCore,
  log,
  PLUGIN_EVENTS,
  PLUGIN_NAMESPACES,
  PLUGIN_STATUS,
  PLUGIN_STATUS_TYPE,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
  WalletServicesPluginError,
} from "@/core/base";

export { BUTTON_POSITION, type BUTTON_POSITION_TYPE, CONFIRMATION_STRATEGY, type CONFIRMATION_STRATEGY_TYPE } from "@web3auth/ws-embed";

export class WalletServicesPlugin extends SafeEventEmitter implements IPlugin {
  name = EVM_PLUGINS.WALLET_SERVICES;

  public status: PLUGIN_STATUS_TYPE = PLUGIN_STATUS.DISCONNECTED;

  readonly SUPPORTED_ADAPTERS = [WALLET_ADAPTERS.AUTH, WALLET_ADAPTERS.SFA];

  readonly pluginNamespace = PLUGIN_NAMESPACES.MULTICHAIN;

  public wsEmbedInstance: WsEmbed;

  private provider: IProvider | null = null;

  private web3auth: IWeb3AuthCore | null = null;

  private isInitialized = false;

  get proxyProvider(): SafeEventEmitterProvider | null {
    return this.wsEmbedInstance.provider ? (this.wsEmbedInstance.provider as unknown as SafeEventEmitterProvider) : null;
  }

  async initWithWeb3Auth(web3auth: IWeb3AuthCore, _whiteLabel?: WhiteLabelData): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw WalletServicesPluginError.web3authRequired();
    if (web3auth.provider && !this.SUPPORTED_ADAPTERS.includes(web3auth.connectedAdapterName)) throw WalletServicesPluginError.notInitialized();
    if (!([CHAIN_NAMESPACES.EIP155, CHAIN_NAMESPACES.SOLANA] as ChainNamespaceType[]).includes(web3auth.coreOptions.chainConfig.chainNamespace))
      throw WalletServicesPluginError.unsupportedChainNamespace();
    // Not connected yet to auth
    if (web3auth.provider) {
      this.provider = web3auth.provider;
    }
    this.web3auth = web3auth;

    // Auth adapter uses WS embed
    const authInstance = web3auth.getAdapter(WALLET_ADAPTERS.AUTH) as AuthAdapter;
    if (!authInstance || !authInstance.wsEmbed) throw WalletServicesPluginError.web3AuthNotConnected();
    this.wsEmbedInstance = authInstance.wsEmbed;

    this.isInitialized = true;
    this.status = PLUGIN_STATUS.READY;
    this.emit(PLUGIN_EVENTS.READY);
  }

  initWithProvider(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async connect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (!this.isInitialized) throw WalletServicesPluginError.notInitialized();
    this.emit(PLUGIN_EVENTS.CONNECTING);
    this.status = PLUGIN_STATUS.CONNECTING;

    if (!this.provider) {
      if (this.web3auth?.provider) {
        this.provider = this.web3auth.provider;
      }
    }

    if (this.web3auth.status !== ADAPTER_STATUS.CONNECTED) {
      throw WalletServicesPluginError.web3AuthNotConnected();
    } else if (!this.web3auth.provider) {
      throw WalletServicesPluginError.providerRequired();
    }

    try {
      this.emit(PLUGIN_EVENTS.CONNECTED);
      this.status = PLUGIN_STATUS.CONNECTED;
    } catch (error: unknown) {
      log.error(error);
      this.status = PLUGIN_STATUS.ERRORED;
      this.emit(PLUGIN_EVENTS.ERRORED, { error: (error as Error).message || "Something went wrong" });
    }
  }

  async showWalletConnectScanner(showWalletConnectParams?: BaseEmbedControllerState["showWalletConnect"]): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showWalletConnectScanner(showWalletConnectParams);
  }

  async showCheckout(showCheckoutParams?: BaseEmbedControllerState["showCheckout"]): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showCheckout(showCheckoutParams);
  }

  async showWalletUi(showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showWalletUi(showWalletUiParams);
  }

  async showSwap(showSwapParams?: BaseEmbedControllerState["showSwap"]): Promise<void> {
    if (!this.wsEmbedInstance.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showSwap(showSwapParams);
  }

  async cleanup(): Promise<void> {
    return this.wsEmbedInstance.cleanUp();
  }

  async disconnect(): Promise<void> {
    // if web3auth is being used and connected to unsupported adapter throw error
    if (this.wsEmbedInstance.isLoggedIn) {
      await this.wsEmbedInstance.logout();
      this.emit(PLUGIN_EVENTS.DISCONNECTED);
      this.status = PLUGIN_STATUS.DISCONNECTED;
    } else {
      throw WalletServicesPluginError.invalidSession("Wallet Services plugin is not connected");
    }
  }
}
