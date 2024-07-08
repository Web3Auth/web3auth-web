import type { BaseConnectorConfig, ChainNamespaceType, IProvider, IWeb3Auth, LoginMethodConfig, WALLET_CONNECTOR_TYPE } from "@web3auth/base";
export interface ModalConfig extends BaseConnectorConfig {
  loginMethods?: LoginMethodConfig;
}

export interface ConnectorsModalConfig {
  chainNamespace: ChainNamespaceType;
  connectors?: Record<WALLET_CONNECTOR_TYPE, ModalConfig>;
}

export interface IWeb3AuthModal extends IWeb3Auth {
  initModal(params?: { modalConfig?: Record<WALLET_CONNECTOR_TYPE, ModalConfig> }): Promise<void>;
  connect(): Promise<IProvider | null>;
}
