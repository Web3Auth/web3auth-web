import { CHAIN_NAMESPACES, EVM_WALLET_ADAPTERS, SOLANA_WALLET_ADAPTERS } from "@web3auth/base";

import { EvmAggregatorConfig, SolanaAggregatorConfig } from "./interface";

export const defaultSolanaAggregatorConfig: SolanaAggregatorConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  adapters: {
    [SOLANA_WALLET_ADAPTERS.TORUS_SOLANA_WALLET]: {},
    [SOLANA_WALLET_ADAPTERS.OPENLOGIN_WALLET]: {},
    [SOLANA_WALLET_ADAPTERS.PHANTOM_WALLET]: {},
  },
};

export const defaultEvmAggregatorConfig: EvmAggregatorConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  adapters: {
    [EVM_WALLET_ADAPTERS.TORUS_EVM_WALLET]: {},
    [EVM_WALLET_ADAPTERS.OPENLOGIN_WALLET]: {},
  },
};
