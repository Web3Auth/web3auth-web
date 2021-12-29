import type { BaseAdapterConfig, ChainNamespaceType, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth/base";
type MetamaskAdapterConfig = BaseAdapterConfig;

interface ModalConfig extends BaseAdapterConfig {
  loginMethods?: LoginMethodConfig;
}

interface DefaultAdaptersModalConfig extends BaseAdapterConfig {
  chainNamespace: ChainNamespaceType;
  adapters?: Record<WALLET_ADAPTER_TYPE, ModalConfig & { configurationRequired?: boolean; options?: unknown }>;
}

export { DefaultAdaptersModalConfig, LoginMethodConfig, MetamaskAdapterConfig, ModalConfig };
