import type { BaseConnectorConfig, ChainNamespaceType, IProvider, IWeb3Auth, LoginMethodConfig, WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

export interface ModalConfig extends Omit<BaseConnectorConfig, "isInjected"> {
  loginMethods?: LoginMethodConfig;
}

export interface ConnectorsModalConfig {
  chainNamespace: ChainNamespaceType;
  connectors?: Record<WALLET_CONNECTOR_TYPE, ModalConfig>;
}

export interface ModalConfigParams {
  modalConfig?: Record<WALLET_CONNECTOR_TYPE, ModalConfig>;
  hideWalletDiscovery?: boolean;
}

export interface IWeb3AuthModal extends IWeb3Auth {
  initModal(params?: ModalConfigParams): Promise<void>;
  connect(): Promise<IProvider | null>;
}
