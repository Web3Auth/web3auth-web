import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig } from "./IChainInterface";
export const DEFAULT_INFURA_ID = "776218ac4734478c90191dde8cae483c";
const getDefaultNetworkId = (chainNamespace: ChainNamespaceType): number => {
  if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
    return 1;
  } else if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return 1;
  }
  throw new Error(`Chain namespace ${chainNamespace} is not supported`);
};

export const getEvmChainConfig = (chainId: number): CustomChainConfig | null => {
  const chainNamespace = CHAIN_NAMESPACES.EIP155;
  if (chainId === 1) {
    return {
      chainNamespace,
      chainId: "0x1",
      rpcTarget: `https://rpc.ankr.com/eth`,
      displayName: "Ethereum Mainnet",
      blockExplorer: "https://etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
    };
  } else if (chainId === 3) {
    return {
      chainNamespace,
      chainId: "0x3",
      rpcTarget: `https://rpc.ankr.com/eth_ropsten`,
      displayName: "ropsten",
      blockExplorer: "https://ropsten.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
    };
  } else if (chainId === 4) {
    return {
      chainNamespace,
      chainId: "0x4",
      rpcTarget: `https://rpc.ankr.com/eth_rinkeby`,
      displayName: "rinkeby",
      blockExplorer: "https://rinkeby.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
    };
  } else if (chainId === 5) {
    return {
      chainNamespace,
      chainId: "0x5",
      rpcTarget: `https://rpc.ankr.com/eth_goerli`,
      displayName: "goerli",
      blockExplorer: "https://goerli.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
    };
  } else if (chainId === 137) {
    return {
      chainNamespace,
      chainId: "0x89",
      rpcTarget: "https://rpc.ankr.com/polygon",
      displayName: "Polygon Mainnet",
      blockExplorer: "https://polygonscan.com",
      ticker: "MATIC",
      tickerName: "Polygon",
    };
  } else if (chainId === 80001) {
    return {
      chainNamespace,
      chainId: "0x13881",
      rpcTarget: "https://rpc.ankr.com/polygon_mumbai",
      displayName: "Polygon Mumbai Testnet",
      blockExplorer: "https://mumbai.polygonscan.com/",
      ticker: "MATIC",
      tickerName: "Polygon",
    };
  } else if (chainId === 56) {
    return {
      chainNamespace,
      chainId: "0x38",
      rpcTarget: "https://rpc.ankr.com/bsc",
      displayName: "Binance SmartChain Mainnet",
      blockExplorer: "https://bscscan.com",
      ticker: "BNB",
      tickerName: "Binance SmartChain",
    };
  } else if (chainId === 97) {
    return {
      chainNamespace,
      chainId: "0x61",
      rpcTarget: "https://rpc.ankr.com/bsc_testnet_chapel",
      displayName: "Binance SmartChain Testnet",
      blockExplorer: "https://testnet.bscscan.com",
      ticker: "BNB",
      tickerName: "Binance SmartChain",
    };
  } else if (chainId === 43114) {
    return {
      chainNamespace,
      chainId: "0xA86A",
      rpcTarget: "https://rpc.ankr.com/avalanche-c",
      displayName: "Avalanche C-Chain Mainnet",
      blockExplorer: "https://subnets.avax.network/c-chain",
      ticker: "AVAX",
      tickerName: "Avalanche C-Chain",
    };
  } else if (chainId === 43113) {
    return {
      chainNamespace,
      chainId: "0xA869",
      rpcTarget: "https://rpc.ankr.com/avalanche_fuji-c",
      displayName: "Avalanche C-Chain Testnet",
      blockExplorer: "https://subnets-test.avax.network/c-chain",
      ticker: "AVAX",
      tickerName: "Avalanche C-Chain",
    };
  } else if (chainId === 42161) {
    return {
      chainNamespace,
      chainId: "0xA4B1",
      rpcTarget: "https://rpc.ankr.com/arbitrum",
      displayName: "Arbitrum Mainnet",
      blockExplorer: "https://arbiscan.io",
      ticker: "AETH",
      tickerName: "Arbitrum",
    };
  } else if (chainId === 421611) {
    return {
      chainNamespace,
      chainId: "0x66EEB",
      rpcTarget: "https://rinkeby.arbitrum.io/rpc",
      displayName: "Arbitrum Rinkeby Testnet",
      blockExplorer: "https://testnet.arbiscan.io",
      ticker: "AETH",
      tickerName: "Arbitrum",
    };
  } else if (chainId === 10) {
    return {
      chainNamespace,
      chainId: "0xA",
      rpcTarget: "https://rpc.ankr.com/optimism",
      displayName: "Optimism Mainnet",
      blockExplorer: "https://optimistic.etherscan.io",
      ticker: "OP",
      tickerName: "Optimism",
    };
  } else if (chainId === 69) {
    return {
      chainNamespace,
      chainId: "0x45",
      rpcTarget: "https://rpc.ankr.com/optimism_testnet",
      displayName: "Optimism Testnet",
      blockExplorer: "https://kovan-optimistic.etherscan.io",
      ticker: "OP",
      tickerName: "Optimism",
    };
  } else if (chainId === 25) {
    return {
      chainNamespace,
      chainId: "0x19",
      rpcTarget: "https://rpc.cronos.org",
      displayName: "Cronos Mainnet",
      blockExplorer: "https://cronoscan.com/",
      ticker: "CRO",
      tickerName: "Cronos",
    };
  } else if (chainId === 338) {
    return {
      chainNamespace,
      chainId: "0x152",
      rpcTarget: "https://rpc-t3.cronos.org/",
      displayName: "Cronos Testnet",
      blockExplorer: "https://cronoscan.com/",
      ticker: "CRO",
      tickerName: "Cronos",
    };
  } else if (chainId === 1666600000) {
    return {
      chainNamespace,
      chainId: "0x63564c40",
      rpcTarget: "https://rpc.ankr.com/harmony",
      displayName: "Harmony Mainnet",
      blockExplorer: "https://explorer.harmony.one",
      ticker: "ONE",
      tickerName: "Harmony",
    };
  } else if (chainId === 42220) {
    return {
      chainNamespace,
      chainId: "0xa4ec",
      rpcTarget: "https://rpc.ankr.com/celo",
      displayName: "Celo Mainnet",
      blockExplorer: "https://explorer.celo.org",
      ticker: "CELO",
      tickerName: "Celo",
    };
  } else if (chainId === 1284) {
    return {
      chainNamespace,
      chainId: "0x504",
      rpcTarget: "https://rpc.ankr.com/moonbeam",
      displayName: "Moonbeam Mainnet",
      blockExplorer: "https://moonbeam.moonscan.io",
      ticker: "GLMR",
      tickerName: "Moonbeam",
    };
  } else if (chainId === 1287) {
    return {
      chainNamespace,
      chainId: "0x507",
      rpcTarget: "https://rpc.api.moonriver.moonbeam.network",
      displayName: "Moonbeam Testnet",
      blockExplorer: "https://moonbase.moonscan.io",
      ticker: "GLMR",
      tickerName: "Moonbeam",
    };
  } else if (chainId === 1285) {
    return {
      chainNamespace,
      chainId: "0x505",
      rpcTarget: "https://rpc.api.moonriver.moonbeam.network",
      displayName: "Moonriver Mainnet",
      blockExplorer: "https://moonriver.moonscan.io",
      ticker: "MOVR",
      tickerName: "Moonriver",
    };
  } else if (chainId === 8217) {
    return {
      chainNamespace,
      chainId: "0x2019",
      rpcTarget: "https://public-node-api.klaytnapi.com/v1/cypress",
      displayName: "Klaytn Mainnet",
      blockExplorer: "https://scope.klaytn.com",
      ticker: "KLAY",
      tickerName: "Klaytn",
    };
  }

  return null;
};

export const getSolanaChainConfig = (chainId: number): CustomChainConfig | null => {
  const chainNamespace = CHAIN_NAMESPACES.SOLANA;
  if (chainId === 1) {
    return {
      chainNamespace,
      chainId: "0x1",
      rpcTarget: "https://rpc.ankr.com/solana",
      displayName: "Solana Mainnet",
      blockExplorer: "https://explorer.solana.com",
      ticker: "SOL",
      tickerName: "Solana",
    };
  } else if (chainId === 2) {
    return {
      chainNamespace,
      chainId: "0x2",
      rpcTarget: "https://api.testnet.solana.com",
      displayName: "Solana Testnet",
      blockExplorer: "https://explorer.solana.com?cluster=testnet",
      ticker: "SOL",
      tickerName: "Solana",
    };
  } else if (chainId === 3) {
    return {
      chainNamespace,
      chainId: "0x3",
      rpcTarget: "https://api.devnet.solana.com",
      displayName: "Solana Devnet",
      blockExplorer: "https://explorer.solana.com?cluster=devnet",
      ticker: "SOL",
      tickerName: "Solana",
    };
  }

  return null;
};

export const getChainConfig = (chainNamespace: ChainNamespaceType, chainId?: number | string): CustomChainConfig | null => {
  if (chainNamespace === CHAIN_NAMESPACES.OTHER) return null;
  const finalChainId = chainId ? (typeof chainId === "number" ? chainId : parseInt(chainId, 16)) : getDefaultNetworkId(chainNamespace);
  if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
    return getEvmChainConfig(finalChainId);
  } else if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return getSolanaChainConfig(finalChainId);
  }
  return null;
};
