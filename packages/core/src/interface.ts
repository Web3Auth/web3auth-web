import type {
  BaseAdapterConfig,
  ChainNamespaceType,
  EVM_ADAPTER_TYPE,
  LoginMethodConfig,
  SOLANA_ADAPTER_TYPE,
  WALLET_ADAPTER_TYPE,
} from "@web3auth/base";
import type { OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import type { SolanaWalletOptions } from "@web3auth/solana-wallet-adapter";
import type { TorusWalletOptions } from "@web3auth/torus-wallet-adapter";

type MetamaskAdapterConfig = BaseAdapterConfig;

interface TorusEvmWalletAdapterConfig extends BaseAdapterConfig {
  options?: TorusWalletOptions;
}

interface TorusSolanaWalletAdapterConfig extends BaseAdapterConfig {
  options: SolanaWalletOptions;
}

interface OpenloginAdapterConfig extends BaseAdapterConfig {
  options: OpenloginAdapterOptions;
  loginMethods?: Record<string, LoginMethodConfig>;
}

type SocialLoginAdapterConfig = OpenloginAdapterConfig;

interface BaseAggregatorConfig {
  chainNamespace: ChainNamespaceType;
}

interface EvmAggregatorConfig extends BaseAggregatorConfig {
  adapters?: Record<EVM_ADAPTER_TYPE, OpenloginAdapterConfig | TorusEvmWalletAdapterConfig>;
}

interface SolanaAggregatorConfig extends BaseAggregatorConfig {
  adapters?: Record<SOLANA_ADAPTER_TYPE, TorusSolanaWalletAdapterConfig | OpenloginAdapterConfig>;
}

type AggregatorModalConfig = EvmAggregatorConfig | SolanaAggregatorConfig;

interface ModalConfig extends BaseAdapterConfig {
  loginMethods?: Record<string, LoginMethodConfig>;
}

interface DefaultAdaptersModalConfig extends BaseAdapterConfig {
  chainNamespace: ChainNamespaceType;
  adapters?: Record<WALLET_ADAPTER_TYPE, ModalConfig & { configurationRequired?: boolean; options?: unknown }>;
}

export {
  AggregatorModalConfig,
  DefaultAdaptersModalConfig,
  EvmAggregatorConfig,
  LoginMethodConfig,
  MetamaskAdapterConfig,
  ModalConfig,
  OpenloginAdapterConfig,
  SocialLoginAdapterConfig,
  SolanaAggregatorConfig,
  TorusEvmWalletAdapterConfig,
  TorusSolanaWalletAdapterConfig,
  TorusWalletOptions,
};
