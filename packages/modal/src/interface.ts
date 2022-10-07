import type { BaseAdapterConfig, ChainNamespaceType, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth-mpc/base";
export interface ModalConfig extends BaseAdapterConfig {
  loginMethods?: LoginMethodConfig;
}

export interface AdaptersModalConfig {
  chainNamespace: ChainNamespaceType;
  adapters?: Record<WALLET_ADAPTER_TYPE, ModalConfig>;
}
