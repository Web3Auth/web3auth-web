import type { BaseAdapterConfig, ChainNamespaceType, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth/base";
type MetamaskAdapterConfig = BaseAdapterConfig;

interface ModalConfig extends BaseAdapterConfig {
  loginMethods?: LoginMethodConfig;
}

interface AdaptersModalConfig extends BaseAdapterConfig {
  chainNamespace: ChainNamespaceType;
  requiredAdapters: Record<string, { alternatives: string[] }>;
  adapters?: Record<WALLET_ADAPTER_TYPE, ModalConfig & { configurationRequired?: boolean }>;
}

export { AdaptersModalConfig, LoginMethodConfig, MetamaskAdapterConfig, ModalConfig };
