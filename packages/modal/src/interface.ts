import type { BaseConnectorConfig, IProvider, IWeb3Auth, LoginMethodConfig, WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

export interface ModalConfig extends Omit<BaseConnectorConfig, "isInjected" | "chainNamespaces"> {
  loginMethods?: LoginMethodConfig;
}

export interface ConnectorsModalConfig {
  connectors?: Partial<Record<WALLET_CONNECTOR_TYPE, ModalConfig>>;
  hideWalletDiscovery?: boolean;
}
export interface IWeb3AuthModal extends IWeb3Auth {
  initModal(options?: { signal?: AbortSignal }): Promise<void>;
  connect(): Promise<IProvider | null>;
}
