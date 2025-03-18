import { SafeEventEmitter, type WhiteLabelData } from "@web3auth/auth";

import {
  CONNECTOR_STATUS,
  EVM_PLUGINS,
  IPlugin,
  IWeb3AuthCore,
  NFTCheckoutPluginError,
  PLUGIN_EVENTS,
  PLUGIN_NAMESPACES,
  PLUGIN_STATUS,
  PLUGIN_STATUS_TYPE,
  PluginFn,
} from "@/core/base";

import { NFTCheckoutEmbed } from "./embed";

export interface NFTCheckoutPluginParams {
  modalZIndex?: number;
  clientId: string;
}

class NFTCheckoutPlugin extends SafeEventEmitter implements IPlugin {
  name = EVM_PLUGINS.NFT_CHECKOUT;

  status: PLUGIN_STATUS_TYPE = PLUGIN_STATUS.DISCONNECTED;

  SUPPORTED_CONNECTORS = ["all"];

  pluginNamespace = PLUGIN_NAMESPACES.EIP155;

  private web3auth: IWeb3AuthCore | null = null;

  private nftCheckoutEmbedInstance: NFTCheckoutEmbed | null = null;

  private isInitialized = false;

  private receiverAddress: string | null = null;

  constructor(params: NFTCheckoutPluginParams) {
    super();
    this.nftCheckoutEmbedInstance = new NFTCheckoutEmbed(params);
  }

  async initWithWeb3Auth(web3auth: IWeb3AuthCore, whiteLabel?: WhiteLabelData): Promise<void> {
    if (this.isInitialized) return;
    if (!web3auth) throw NFTCheckoutPluginError.web3authRequired();

    this.web3auth = web3auth;
    await this.nftCheckoutEmbedInstance.init({
      whiteLabel,
    });

    this.isInitialized = true;
    this.status = PLUGIN_STATUS.READY;
    this.emit(PLUGIN_EVENTS.READY);
  }

  async connect(): Promise<void> {
    if (!this.isInitialized) throw NFTCheckoutPluginError.notInitialized();
    this.emit(PLUGIN_EVENTS.CONNECTING);
    this.status = PLUGIN_STATUS.CONNECTING;

    if (this.web3auth.status !== CONNECTOR_STATUS.CONNECTED) throw NFTCheckoutPluginError.web3AuthNotConnected();
    if (!this.web3auth.provider) throw NFTCheckoutPluginError.providerRequired();

    const accounts = await this.web3auth.provider.request<never, string[]>({
      method: "eth_accounts",
    });
    if (accounts.length === 0) throw NFTCheckoutPluginError.web3AuthNotConnected();
    this.receiverAddress = accounts[0];

    this.emit(PLUGIN_EVENTS.CONNECTED);
    this.status = PLUGIN_STATUS.CONNECTED;
  }

  async show({ contractId }: { contractId: string }): Promise<void> {
    if (this.status !== PLUGIN_STATUS.CONNECTED) NFTCheckoutPluginError.pluginNotConnected();
    return this.nftCheckoutEmbedInstance.show({ receiverAddress: this.receiverAddress, contractId });
  }

  disconnect(): Promise<void> {
    if (this.status !== PLUGIN_STATUS.CONNECTED) NFTCheckoutPluginError.pluginNotConnected();
    this.emit(PLUGIN_EVENTS.DISCONNECTED);
    this.status = PLUGIN_STATUS.DISCONNECTED;
    return Promise.resolve();
  }

  cleanup(): Promise<void> {
    this.nftCheckoutEmbedInstance.cleanup();
    this.receiverAddress = null;
    this.isInitialized = false;
    return Promise.resolve();
  }
}

export type NFTCheckoutPluginType = NFTCheckoutPlugin;

export const nftCheckoutPlugin = (params: NFTCheckoutPluginParams): PluginFn => {
  return () => {
    return new NFTCheckoutPlugin(params);
  };
};
