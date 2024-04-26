import { type SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { IProvider, UserInfo } from "../adapter";
import { CHAIN_NAMESPACES } from "../chain/IChainInterface";
import { type IWeb3Auth } from "../core/IWeb3Auth";
import { WALLET_ADAPTER_TYPE } from "../wallet";

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

export const PLUGIN_EVENTS = {
  ...PLUGIN_STATUS,
} as const;

export type PluginNamespace = (typeof PLUGIN_NAMESPACES)[keyof typeof PLUGIN_NAMESPACES];

export const EVM_PLUGINS = {
  WALLET_SERVICES: "wallet-services",
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
  SUPPORTED_ADAPTERS: WALLET_ADAPTER_TYPE[];
  pluginNamespace: PluginNamespace;
  initWithProvider(provider: IProvider, userInfo: UserInfo): Promise<void>;
  initWithWeb3Auth(web3auth: IWeb3Auth): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
