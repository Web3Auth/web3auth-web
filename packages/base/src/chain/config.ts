import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig } from "./IChainInterface";
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
      decimals: 18,
    };
  }
  if (chainId === 5) {
    return {
      chainNamespace,
      chainId: "0x5",
      rpcTarget: `https://rpc.ankr.com/eth_goerli`,
      displayName: "Goerli Testnet",
      blockExplorer: "https://goerli.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18,
    };
  }
  if (chainId === 11155111) {
    return {
      chainNamespace,
      chainId: "0xaa36a7",
      rpcTarget: `https://rpc.ankr.com/eth_sepolia`,
      displayName: "Sepolia Testnet",
      blockExplorer: "https://sepolia.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18,
    };
  }
  if (chainId === 137) {
    return {
      chainNamespace,
      chainId: "0x89",
      rpcTarget: "https://rpc.ankr.com/polygon",
      displayName: "Polygon Mainnet",
      blockExplorer: "https://polygonscan.com",
      ticker: "MATIC",
      tickerName: "Polygon",
    };
  }
  if (chainId === 80001) {
    return {
      chainNamespace,
      chainId: "0x13881",
      rpcTarget: "https://rpc.ankr.com/polygon_mumbai",
      displayName: "Polygon Mumbai Testnet",
      blockExplorer: "https://mumbai.polygonscan.com/",
      ticker: "MATIC",
      tickerName: "Polygon",
      decimals: 18,
    };
  }
  if (chainId === 56) {
    return {
      chainNamespace,
      chainId: "0x38",
      rpcTarget: "https://rpc.ankr.com/bsc",
      displayName: "Binance SmartChain Mainnet",
      blockExplorer: "https://bscscan.com",
      ticker: "BNB",
      tickerName: "Binance SmartChain",
      decimals: 18,
    };
  }
  if (chainId === 97) {
    return {
      chainNamespace,
      chainId: "0x61",
      rpcTarget: "https://rpc.ankr.com/bsc_testnet_chapel",
      displayName: "Binance SmartChain Testnet",
      blockExplorer: "https://testnet.bscscan.com",
      ticker: "BNB",
      tickerName: "Binance SmartChain",
      decimals: 18,
    };
  }
  if (chainId === 25) {
    return {
      chainNamespace,
      chainId: "0x19",
      rpcTarget: "https://rpc.cronos.org",
      displayName: "Cronos Mainnet",
      blockExplorer: "https://cronoscan.com/",
      ticker: "CRO",
      tickerName: "Cronos",
    };
  }
  if (chainId === 338) {
    return {
      chainNamespace,
      chainId: "0x152",
      rpcTarget: "https://rpc-t3.cronos.org/",
      displayName: "Cronos Testnet",
      blockExplorer: "https://cronoscan.com/",
      ticker: "CRO",
      tickerName: "Cronos",
      decimals: 18,
    };
  }
  if (chainId === 8217) {
    return {
      chainNamespace,
      chainId: "0x2019",
      rpcTarget: "https://public-node-api.klaytnapi.com/v1/cypress",
      displayName: "Klaytn Mainnet",
      blockExplorer: "https://scope.klaytn.com",
      ticker: "KLAY",
      tickerName: "Klaytn",
      decimals: 18,
    };
  }
  if (chainId === 1482601649) {
    return {
      chainNamespace,
      chainId: "0x585eb4b1",
      rpcTarget: "https://mainnet.skalenodes.com/v1/green-giddy-denebola",
      displayName: "SKALE Nebula Gaming Hub",
      blockExplorer: "https://green-giddy-denebola.explorer.mainnet.skalenodes.com/",
      ticker: "sFUEL",
      tickerName: "SKALE",
      decimals: 18,
    };
  }
  if (chainId === 503129905) {
    return {
      chainNamespace,
      chainId: "0x1dfd2731",
      rpcTarget: "https://staging-v3.skalenodes.com/v1/staging-faint-slimy-achird",
      displayName: "SKALE Nebula Gaming Hub Testnet",
      blockExplorer: "https://staging-faint-slimy-achird.explorer.staging-v3.skalenodes.com/",
      ticker: "sFUEL",
      tickerName: "SKALE",
      decimals: 18,
    };
  }
  if (chainId === 2046399126) {
    return {
      chainNamespace,
      chainId: "0x79f99296",
      rpcTarget: "https://mainnet.skalenodes.com/v1/elated-tan-skat",
      displayName: "SKALE Europa DeFi Hub",
      blockExplorer: "https://elated-tan-skat.explorer.mainnet.skalenodes.com/",
      ticker: "sFUEL",
      tickerName: "SKALE",
      decimals: 18,
    };
  }
  if (chainId === 476158412) {
    return {
      chainNamespace,
      chainId: "0x1c6199cc",
      rpcTarget: "https://staging-v3.skalenodes.com/v1/staging-legal-crazy-castor",
      displayName: "SKALE Europa DeFi Hub Testnet",
      blockExplorer: "https://staging-legal-crazy-castor.explorer.staging-v3.skalenodes.com/",
      ticker: "sFUEL",
      tickerName: "SKALE",
      decimals: 18,
    };
  }
  if (chainId === 1564830818) {
    return {
      chainNamespace,
      chainId: "0x5d456c62",
      rpcTarget: "https://mainnet.skalenodes.com/v1/honorable-steel-rasalhague",
      displayName: "SKALE Calypso NFT Hub",
      blockExplorer: "https://honorable-steel-rasalhague.explorer.mainnet.skalenodes.com/",
      ticker: "sFUEL",
      tickerName: "SKALE",
      decimals: 18,
    };
  }
  if (chainId === 344106930) {
    return {
      chainNamespace,
      chainId: "0x1482a7b2",
      rpcTarget: "https://staging-v3.skalenodes.com/v1/staging-utter-unripe-menkar",
      displayName: "SKALE Calypso NFT Hub Testnet",
      blockExplorer: "https://staging-utter-unripe-menkar.explorer.staging-v3.skalenodes.com/",
      ticker: "sFUEL",
      tickerName: "SKALE",
      decimals: 18,
    };
  }
  if (chainId === 1351057110) {
    return {
      chainNamespace,
      chainId: "0x50877ed6",
      rpcTarget: "https://staging-v3.skalenodes.com/v1/staging-fast-active-bellatrix",
      displayName: "SKALE Chaos Testnet",
      blockExplorer: "https://staging-fast-active-bellatrix.explorer.staging-v3.skalenodes.com/",
      ticker: "sFUEL",
      tickerName: "SKALE",
      decimals: 18,
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
      decimals: 9,
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
      decimals: 9,
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
      decimals: 9,
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
