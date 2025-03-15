import { type BaseEmbedControllerState } from "@toruslabs/base-controllers";
import { SafeEventEmitter, type WhiteLabelData } from "@web3auth/auth";
import WsEmbed from "@web3auth/ws-embed";

import { type AuthConnectorType } from "@/core/auth-connector";
import {
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  CONNECTOR_STATUS,
  EVM_PLUGINS,
  IPlugin,
  IProvider,
  IWeb3AuthCore,
  log,
  PLUGIN_EVENTS,
  PLUGIN_NAMESPACES,
  PLUGIN_STATUS,
  PLUGIN_STATUS_TYPE,
  PluginFn,
  SafeEventEmitterProvider,
  WALLET_CONNECTORS,
  WalletServicesPluginError,
} from "@/core/base";

export { BUTTON_POSITION, type BUTTON_POSITION_TYPE, CONFIRMATION_STRATEGY, type CONFIRMATION_STRATEGY_TYPE } from "@web3auth/ws-embed";

// TODO: support project config items here. incl. key export flag, multiple chains
class WalletServicesPlugin extends SafeEventEmitter implements IPlugin {
  name = EVM_PLUGINS.WALLET_SERVICES;

  public status: PLUGIN_STATUS_TYPE = PLUGIN_STATUS.DISCONNECTED;

  readonly SUPPORTED_CONNECTORS = [WALLET_CONNECTORS.AUTH, WALLET_CONNECTORS.SFA];

  readonly pluginNamespace = PLUGIN_NAMESPACES.MULTICHAIN;

  public wsEmbedInstance: WsEmbed;

  private provider: IProvider | null = null;

  private web3auth: IWeb3AuthCore | null = null;

  private isInitialized = false;

  get proxyProvider(): SafeEventEmitterProvider | null {
    return this.wsEmbedInstance?.provider ? (this.wsEmbedInstance.provider as unknown as SafeEventEmitterProvider) : null;
  }

  async initWithWeb3Auth(web3auth: IWeb3AuthCore, _whiteLabel?: WhiteLabelData): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw WalletServicesPluginError.web3authRequired();
    if (web3auth.provider && !this.SUPPORTED_CONNECTORS.includes(web3auth.connectedConnectorName)) throw WalletServicesPluginError.notInitialized();
    const currentChainConfig = web3auth.currentChain;
    if (!([CHAIN_NAMESPACES.EIP155, CHAIN_NAMESPACES.SOLANA] as ChainNamespaceType[]).includes(currentChainConfig?.chainNamespace))
      throw WalletServicesPluginError.unsupportedChainNamespace();

    // Not connected yet to auth
    if (web3auth.provider) {
      this.provider = web3auth.provider;
    }
    this.web3auth = web3auth;

    // Auth connector uses WS embed
    const authInstance = web3auth.getConnector(WALLET_CONNECTORS.AUTH) as AuthConnectorType;
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
    // if web3auth is being used and connected to unsupported connector throw error
    if (!this.isInitialized) throw WalletServicesPluginError.notInitialized();
    this.emit(PLUGIN_EVENTS.CONNECTING);
    this.status = PLUGIN_STATUS.CONNECTING;

    if (!this.provider) {
      if (this.web3auth?.provider) {
        this.provider = this.web3auth.provider;
      }
    }

    if (this.web3auth.status !== CONNECTOR_STATUS.CONNECTED) {
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
    if (!this.wsEmbedInstance?.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showWalletConnectScanner(showWalletConnectParams);
  }

  async showCheckout(showCheckoutParams?: BaseEmbedControllerState["showCheckout"]): Promise<void> {
    if (!this.wsEmbedInstance?.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showCheckout(showCheckoutParams);
  }

  async showWalletUi(showWalletUiParams?: BaseEmbedControllerState["showWalletUi"]): Promise<void> {
    if (!this.wsEmbedInstance?.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showWalletUi(showWalletUiParams);
  }

  async showSwap(showSwapParams?: BaseEmbedControllerState["showSwap"]): Promise<void> {
    if (!this.wsEmbedInstance?.isLoggedIn) throw WalletServicesPluginError.walletPluginNotConnected();
    return this.wsEmbedInstance.showSwap(showSwapParams);
  }

  async cleanup(): Promise<void> {
    return this.wsEmbedInstance?.cleanUp();
  }

  async disconnect(): Promise<void> {
    if (this.status !== PLUGIN_STATUS.CONNECTED) throw WalletServicesPluginError.invalidSession("Wallet Services plugin is not connected");
    if (this.wsEmbedInstance?.isLoggedIn) {
      await this.wsEmbedInstance.logout();
    }
    this.emit(PLUGIN_EVENTS.DISCONNECTED);
    this.status = PLUGIN_STATUS.DISCONNECTED;
  }
}

export type WalletServicesPluginType = WalletServicesPlugin;

export const walletServicesPlugin = (): PluginFn => {
  return () => {
    return new WalletServicesPlugin();
  };
};
