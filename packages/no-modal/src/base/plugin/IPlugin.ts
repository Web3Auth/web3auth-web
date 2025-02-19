import { type SafeEventEmitter, WhiteLabelData } from "@web3auth/auth";

import { CHAIN_NAMESPACES } from "../chain/IChainInterface";
import { type IWeb3AuthCore } from "../core/IWeb3Auth";
import { WALLET_CONNECTOR_TYPE } from "../wallet";

export const PLUGIN_NAMESPACES = {
  ...CHAIN_NAMESPACES,
  MULTICHAIN: "multichain",
} as const;

export const PLUGIN_STATUS = {
  READY: "ready",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERRORED: "errored",
} as const;

export type PLUGIN_STATUS_TYPE = (typeof PLUGIN_STATUS)[keyof typeof PLUGIN_STATUS];

export const PLUGIN_EVENTS = {
  ...PLUGIN_STATUS,
} as const;

export type PluginNamespace = (typeof PLUGIN_NAMESPACES)[keyof typeof PLUGIN_NAMESPACES];

export const EVM_PLUGINS = {
  WALLET_SERVICES: "wallet-services",
  NFT_CHECKOUT: "nft-checkout",
} as const;

export const SOLANA_PLUGINS = {
  SOLANA: "solana",
} as const;

export const WALLET_PLUGINS = {
  ...EVM_PLUGINS,
  ...SOLANA_PLUGINS,
} as const;

export interface IPlugin extends SafeEventEmitter {
  name: string;
  status: PLUGIN_STATUS_TYPE;
  SUPPORTED_CONNECTORS: WALLET_CONNECTOR_TYPE[];
  pluginNamespace: PluginNamespace;
  initWithWeb3Auth(web3auth: IWeb3AuthCore, whiteLabel?: WhiteLabelData): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  cleanup(): Promise<void>;
}
