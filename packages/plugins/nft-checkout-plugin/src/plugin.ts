import { SafeEventEmitter, type WhiteLabelData } from "@web3auth/auth";
import {
  ADAPTER_STATUS,
  EVM_PLUGINS,
  IPlugin,
  IWeb3AuthCore,
  PLUGIN_EVENTS,
  PLUGIN_NAMESPACES,
  PLUGIN_STATUS,
  PLUGIN_STATUS_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";

import { NFTCheckoutEmbed } from "./embed";
import { NFT_CHECKOUT_BUILD_ENV } from "./enums";

export class NFTCheckoutPlugin extends SafeEventEmitter implements IPlugin {
  name = EVM_PLUGINS.NFT_CHECKOUT;

  status: PLUGIN_STATUS_TYPE = PLUGIN_STATUS.DISCONNECTED;

  SUPPORTED_ADAPTERS = [WALLET_ADAPTERS.AUTH, WALLET_ADAPTERS.SFA]; // TODO: check this

  pluginNamespace = PLUGIN_NAMESPACES.EIP155;

  private web3auth: IWeb3AuthCore | null = null;

  private nftCheckoutEmbedInstance: NFTCheckoutEmbed | null = null;

  private isInitialized = false;

  private receiverAddress: string | null = null;

  constructor(params: { modalZIndex: number; contractId: string; apiKey: string }) {
    super();
    this.nftCheckoutEmbedInstance = new NFTCheckoutEmbed(params);
  }

  async initWithWeb3Auth(web3auth: IWeb3AuthCore, whiteLabel?: WhiteLabelData): Promise<void> {
    if (this.isInitialized) return;
    this.web3auth = web3auth;

    await this.nftCheckoutEmbedInstance.init({
      buildEnv: NFT_CHECKOUT_BUILD_ENV.DEVELOPMENT, // TODO: remove this, use production only
      whiteLabel,
    });

    this.isInitialized = true;
    this.status = PLUGIN_STATUS.READY;
    this.emit(PLUGIN_EVENTS.READY);
  }

  async connect(): Promise<void> {
    if (!this.isInitialized) throw new Error("Plugin is not initialized"); // TODO: create error in base
    this.emit(PLUGIN_EVENTS.CONNECTING);
    this.status = PLUGIN_STATUS.CONNECTING;

    if (this.web3auth.status !== ADAPTER_STATUS.CONNECTED) {
      throw new Error("Web3Auth is not connected"); // TODO: create error in base
    } else if (!this.web3auth.provider) {
      throw new Error("Provider is required"); // TODO: create error in base
    }

    const accounts = await this.web3auth.provider.request<never, string[]>({
      method: "eth_accounts",
    });
    if (accounts.length === 0) throw new Error("No accounts found"); // TODO: create error in base
    this.receiverAddress = accounts[0];

    this.emit(PLUGIN_EVENTS.CONNECTED);
    this.status = PLUGIN_STATUS.CONNECTED;
  }

  async show(): Promise<void> {
    if (this.status !== PLUGIN_STATUS.CONNECTED) throw new Error("Plugin is not connected"); // TODO: create error in base
    return this.nftCheckoutEmbedInstance.show({ receiverAddress: this.receiverAddress });
  }

  disconnect(): Promise<void> {
    if (this.status !== PLUGIN_STATUS.CONNECTED) throw new Error("Plugin is not connected"); // TODO: create error in base
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
