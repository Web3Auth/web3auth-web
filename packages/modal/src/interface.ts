import type { BaseAdapterConfig, ChainNamespaceType, IProvider, IWeb3Auth, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth/base";
export interface ModalConfig extends BaseAdapterConfig {
  loginMethods?: LoginMethodConfig;
}

export interface AdaptersModalConfig {
  chainNamespace: ChainNamespaceType;
  adapters?: Record<WALLET_ADAPTER_TYPE, ModalConfig>;
}

export interface IWeb3AuthModal extends IWeb3Auth {
  initModal(params?: { modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig> }): Promise<void>;
  connect(): Promise<IProvider | null>;
}
