import type { BaseAdapterConfig, ChainNamespaceType, EVM_ADAPTER_TYPE, LoginMethodConfig, SOLANA_ADAPTER_TYPE } from "@web3auth/base";
import type { OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import type { SolanaWalletOptions } from "@web3auth/solana-wallet-adapter";
import type { TorusWalletOptions } from "@web3auth/torus-wallet-adapter";

interface TorusEvmWalletAdapterConfig extends BaseAdapterConfig {
  options?: TorusWalletOptions;
}

interface TorusSolanaWalletAdapterConfig extends BaseAdapterConfig {
  options?: SolanaWalletOptions;
}

interface OpenloginAdapterConfig extends BaseAdapterConfig {
  options?: OpenloginAdapterOptions;
  loginMethods?: Record<string, LoginMethodConfig>;
}

interface BaseAggregatorConfig {
  chainNamespace: ChainNamespaceType;
}

interface EvmAggregatorConfig extends BaseAggregatorConfig {
  adapters?: Record<EVM_ADAPTER_TYPE, TorusEvmWalletAdapterConfig | OpenloginAdapterConfig>;
}

interface SolanaAggregatorConfig extends BaseAggregatorConfig {
  adapters?: Record<SOLANA_ADAPTER_TYPE, TorusSolanaWalletAdapterConfig | OpenloginAdapterConfig>;
}

type AggregatorModalConfig = EvmAggregatorConfig | SolanaAggregatorConfig;

export { AggregatorModalConfig, EvmAggregatorConfig, LoginMethodConfig, SolanaAggregatorConfig, TorusWalletOptions };
