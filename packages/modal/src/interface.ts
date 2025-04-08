import type { BaseConnectorConfig, IProvider, IWeb3Auth, LoginMethodConfig, WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

export interface ModalConfig extends Omit<BaseConnectorConfig, "isInjected" | "chainNamespace"> {
  loginMethods?: LoginMethodConfig;
}

export interface ConnectorsModalConfig {
  connectors?: Record<WALLET_CONNECTOR_TYPE, ModalConfig>;
  hideWalletDiscovery?: boolean;
}
export interface IWeb3AuthModal extends IWeb3Auth {
  initModal(): Promise<void>;
  connect(): Promise<IProvider | null>;
}
