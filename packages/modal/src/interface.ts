import type { BaseAdapterConfig, ChainNamespaceType, LoginMethodConfig, WALLET_ADAPTER_TYPE } from "@web3auth/base";
type MetamaskAdapterConfig = BaseAdapterConfig;

interface ModalConfig extends BaseAdapterConfig {
  loginMethods?: LoginMethodConfig;
}

interface AdaptersModalConfig {
  chainNamespace: ChainNamespaceType;
  adapters?: Record<WALLET_ADAPTER_TYPE, ModalConfig>;
}

export { AdaptersModalConfig, LoginMethodConfig, MetamaskAdapterConfig, ModalConfig };
