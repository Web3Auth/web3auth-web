import { CHAIN_NAMESPACES, IWeb3Auth, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTER_TYPE } from "@web3auth/base";

export const PLUGIN_NAMESPACES = {
  ...CHAIN_NAMESPACES,
  MULTICHAIN: "multichain",
} as const;

export type PluginNamespace = (typeof PLUGIN_NAMESPACES)[keyof typeof PLUGIN_NAMESPACES];

export interface IPlugin {
  name: string;
  SUPPORTED_ADAPTERS: WALLET_ADAPTER_TYPE[];
  pluginNamespace: PluginNamespace;
  initWithProvider(provider: SafeEventEmitterProvider, userInfo: UserInfo): Promise<void>;
  initWithWeb3Auth(web3auth: IWeb3Auth): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
