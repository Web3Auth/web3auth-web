import { WalletInitializationError } from "../errors";
import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig } from "./IChainInterface";
const getDefaultNetworkId = (chainNamespace: ChainNamespaceType): number => {
  if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
    return 1;
  } else if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return 1;
  } else if (chainNamespace === CHAIN_NAMESPACES.XRPL) {
    return 1;
  }
  throw WalletInitializationError.invalidParams(`Chain namespace ${chainNamespace} is not supported`);
};

export const getEvmChainConfig = (chainId: number): CustomChainConfig | null => {
  const chainNamespace = CHAIN_NAMESPACES.EIP155;
  if (chainId === 1) {
    return {
      logo: "https://images.toruswallet.io/eth.svg",
      chainNamespace,
      chainId: "0x1",
      rpcTarget: `https://rpc.ankr.com/eth`,
      displayName: "Ethereum Mainnet",
      blockExplorerUrl: "https://etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18,
    };
  }
  if (chainId === 5) {
    return {
      logo: "https://images.toruswallet.io/eth.svg",
      chainNamespace,
      chainId: "0x5",
      rpcTarget: `https://rpc.ankr.com/eth_goerli`,
      displayName: "Goerli Testnet",
      blockExplorerUrl: "https://goerli.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18,
    };
  }
  if (chainId === 11155111) {
    return {
      logo: "https://images.toruswallet.io/eth.svg",
      chainNamespace,
      chainId: "0xaa36a7",
      rpcTarget: `https://rpc.ankr.com/eth_sepolia`,
      displayName: "Sepolia Testnet",
      blockExplorerUrl: "https://sepolia.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18,
    };
  }
  if (chainId === 137) {
    return {
      logo: "https://images.toruswallet.io/polygon.svg",
      chainNamespace,
      chainId: "0x89",
      rpcTarget: "https://rpc.ankr.com/polygon",
      displayName: "Polygon Mainnet",
      blockExplorerUrl: "https://polygonscan.com",
      ticker: "POL",
      tickerName: "Polygon Ecosystem Token",
    };
  }
  if (chainId === 80002) {
    return {
      logo: "https://images.toruswallet.io/polygon.svg",
      chainNamespace,
      chainId: "0x13882",
      rpcTarget: "https://rpc.ankr.com/polygon_amoy",
      displayName: "Polygon Amoy Testnet",
      blockExplorerUrl: "https://www.oklink.com/amoy",
      ticker: "POL",
      tickerName: "Polygon Ecosystem Token",
      decimals: 18,
    };
  }
  if (chainId === 56) {
    return {
      logo: "https://images.toruswallet.io/bnb.png",
      chainNamespace,
      chainId: "0x38",
      rpcTarget: "https://rpc.ankr.com/bsc",
      displayName: "Binance SmartChain Mainnet",
      blockExplorerUrl: "https://bscscan.com",
      ticker: "BNB",
      tickerName: "Binance SmartChain",
      decimals: 18,
    };
  }
  if (chainId === 97) {
    return {
      logo: "https://images.toruswallet.io/bnb.png",
      chainNamespace,
      chainId: "0x61",
      rpcTarget: "https://rpc.ankr.com/bsc_testnet_chapel",
      displayName: "Binance SmartChain Testnet",
      blockExplorerUrl: "https://testnet.bscscan.com",
      ticker: "BNB",
      tickerName: "Binance SmartChain",
      decimals: 18,
    };
  }
  if (chainId === 25) {
    return {
      logo: "https://images.toruswallet.io/cro.svg",
      chainNamespace,
      chainId: "0x19",
      rpcTarget: "https://rpc.cronos.org",
      displayName: "Cronos Mainnet",
      blockExplorerUrl: "https://cronoscan.com/",
      ticker: "CRO",
      tickerName: "Cronos",
    };
  }
  if (chainId === 338) {
    return {
      logo: "https://images.toruswallet.io/cro.svg",
      chainNamespace,
      chainId: "0x152",
      rpcTarget: "https://rpc-t3.cronos.org/",
      displayName: "Cronos Testnet",
      blockExplorerUrl: "https://cronoscan.com/",
      ticker: "CRO",
      tickerName: "Cronos",
      decimals: 18,
    };
  }
  if (chainId === 8217) {
    return {
      logo: "https://images.toruswallet.io/klay.svg",
      chainNamespace,
      chainId: "0x2019",
      rpcTarget: "https://public-node-api.klaytnapi.com/v1/cypress",
      displayName: "Klaytn Mainnet",
      blockExplorerUrl: "https://scope.klaytn.com",
      ticker: "KLAY",
      tickerName: "Klaytn",
      decimals: 18,
    };
  }
  if (chainId === 1946) {
    return {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0x79a",
      rpcTarget: "https://rpc.minato.soneium.org",
      displayName: "Soneium Minato Testnet",
      blockExplorerUrl: "https://explorer-testnet.soneium.org",
      ticker: "ETH",
      tickerName: "ETH",
      logo: "https://iili.io/2i5xce2.png",
    };
  }

  return null;
};

export const getSolanaChainConfig = (chainId: number): CustomChainConfig | null => {
  const chainNamespace = CHAIN_NAMESPACES.SOLANA;
  if (chainId === 1) {
    return {
      logo: "https://images.toruswallet.io/sol.svg",
      chainNamespace,
      chainId: "0x1",
      rpcTarget: "https://rpc.ankr.com/solana",
      displayName: "Solana Mainnet",
      blockExplorerUrl: "https://explorer.solana.com",
      ticker: "SOL",
      tickerName: "Solana",
      decimals: 9,
    };
  } else if (chainId === 2) {
    return {
      logo: "https://images.toruswallet.io/sol.svg",
      chainNamespace,
      chainId: "0x2",
      rpcTarget: "https://api.testnet.solana.com",
      displayName: "Solana Testnet",
      blockExplorerUrl: "https://explorer.solana.com?cluster=testnet",
      ticker: "SOL",
      tickerName: "Solana",
      decimals: 9,
    };
  } else if (chainId === 3) {
    return {
      logo: "https://images.toruswallet.io/sol.svg",
      chainNamespace,
      chainId: "0x3",
      rpcTarget: "https://api.devnet.solana.com",
      displayName: "Solana Devnet",
      blockExplorerUrl: "https://explorer.solana.com?cluster=devnet",
      ticker: "SOL",
      tickerName: "Solana",
      decimals: 9,
    };
  }

  return null;
};

export const getXrplChainConfig = (chainId: number): CustomChainConfig | null => {
  const chainNamespace = CHAIN_NAMESPACES.XRPL;
  if (chainId === 1) {
    return {
      chainNamespace,
      decimals: 15,
      chainId: "0x1",
      logo: "https://images.toruswallet.io/XRP.svg",
      rpcTarget: "https://ripple-node.tor.us",
      wsTarget: "wss://s2.ripple.com",
      ticker: "XRP",
      tickerName: "XRPL",
      displayName: "xrpl mainnet",
      blockExplorerUrl: "https://livenet.xrpl.org",
    };
  } else if (chainId === 2) {
    return {
      chainNamespace,
      decimals: 15,
      chainId: "0x2",
      logo: "https://images.toruswallet.io/XRP.svg",
      rpcTarget: "https://testnet-ripple-node.tor.us",
      wsTarget: "wss://s.altnet.rippletest.net",
      ticker: "XRP",
      tickerName: "XRPL",
      displayName: "xrpl testnet",
      blockExplorerUrl: "https://testnet.xrpl.org",
      isTestnet: true,
    };
  } else if (chainId === 3) {
    return {
      chainNamespace,
      decimals: 15,
      chainId: "0x3",
      logo: "https://images.toruswallet.io/XRP.svg",
      rpcTarget: "https://devnet-ripple-node.tor.us",
      wsTarget: "wss://s.devnet.rippletest.net/",
      ticker: "XRP",
      tickerName: "XRPL",
      displayName: "xrpl devnet",
      blockExplorerUrl: "https://devnet.xrpl.org",
      isTestnet: true,
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
  } else if (chainNamespace === CHAIN_NAMESPACES.XRPL) {
    return getXrplChainConfig(finalChainId);
  }
  return null;
};
