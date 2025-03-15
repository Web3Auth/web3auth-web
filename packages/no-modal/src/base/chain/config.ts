import { WalletInitializationError } from "../errors";
import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig } from "./IChainInterface";

const INFURA_PROXY_URL = "https://api.web3auth.io/infura-service/v1";

const getDefaultNetworkId = (chainNamespace: ChainNamespaceType): number => {
  if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
    return 1;
  }
  if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return 1;
  }
  if (chainNamespace === CHAIN_NAMESPACES.XRPL) {
    return 1;
  }
  throw WalletInitializationError.invalidParams(`Chain namespace ${chainNamespace} is not supported`);
};
// TODO: remove this function and get this from dashboard instead
export const getEvmChainConfig = (chainId: number, web3AuthClientId: string = ""): CustomChainConfig | null => {
  const chainNamespace = CHAIN_NAMESPACES.EIP155;
  const infuraRpcTarget = `${INFURA_PROXY_URL}/${chainId}/${web3AuthClientId}`;
  if (chainId === 1) {
    return {
      logo: "https://images.toruswallet.io/eth.svg",
      chainNamespace,
      chainId: "0x1",
      rpcTarget: infuraRpcTarget,
      displayName: "Ethereum Mainnet",
      blockExplorerUrl: "https://etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18,
    };
  }
  if (chainId === 10) {
    return {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      decimals: 18,
      blockExplorerUrl: "https://optimistic.etherscan.io",
      chainId: "0xa",
      displayName: "Optimism",
      logo: "optimism.svg",
      rpcTarget: infuraRpcTarget,
      ticker: "ETH",
      tickerName: "Ethereum",
    };
  }
  if (chainId === 8453) {
    return {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      decimals: 18,
      blockExplorerUrl: "https://basescan.org",
      chainId: "0x2105",
      displayName: "Base",
      logo: "base.svg",
      rpcTarget: infuraRpcTarget,
      ticker: "ETH",
      tickerName: "Ethereum",
    };
  }
  if (chainId === 42161) {
    return {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      decimals: 18,
      blockExplorerUrl: "https://arbiscan.io",
      chainId: "0xa4b1",
      displayName: "Arbitrum One",
      logo: "arbitrum.svg",
      rpcTarget: infuraRpcTarget,
      ticker: "ETH",
      tickerName: "Ethereum",
    };
  }
  if (chainId === 59144) {
    return {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      decimals: 18,
      blockExplorerUrl: "https://lineascan.build",
      chainId: "0xe708",
      logo: "https://images.toruswallet.io/eth.svg",
      rpcTarget: infuraRpcTarget,
      ticker: "ETH",
      tickerName: "Ethereum",
      displayName: "Linea",
    };
  }
  if (chainId === 11155111) {
    return {
      logo: "https://images.toruswallet.io/eth.svg",
      chainNamespace,
      chainId: "0xaa36a7",
      rpcTarget: infuraRpcTarget,
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
      rpcTarget: infuraRpcTarget,
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
      rpcTarget: infuraRpcTarget,
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
      rpcTarget: infuraRpcTarget,
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
      rpcTarget: infuraRpcTarget,
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
  if (chainId === 1868) {
    return {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0x74c",
      rpcTarget: "https://rpc.soneium.org",
      displayName: "Soneium Mainnet",
      blockExplorerUrl: "https://soneium.blockscout.com",
      ticker: "ETH",
      tickerName: "ETH",
      logo: "https://iili.io/2i5xce2.png",
    };
  }

  return null;
};

export const getSolanaChainConfig = (chainId: number): CustomChainConfig | null => {
  const chainNamespace = CHAIN_NAMESPACES.SOLANA;
  // support both cross chain id and base solana chain id from 1
  if (chainId === 101 || chainId === 1) {
    return {
      logo: "https://images.toruswallet.io/sol.svg",
      chainNamespace,
      chainId: "0x65",
      rpcTarget: "https://rpc.ankr.com/solana",
      displayName: "Solana Mainnet",
      blockExplorerUrl: "https://explorer.solana.com",
      ticker: "SOL",
      tickerName: "Solana",
      decimals: 9,
    };
  } else if (chainId === 102 || chainId === 2) {
    return {
      logo: "https://images.toruswallet.io/sol.svg",
      chainNamespace,
      chainId: "0x66",
      rpcTarget: "https://api.testnet.solana.com",
      displayName: "Solana Testnet",
      blockExplorerUrl: "https://explorer.solana.com?cluster=testnet",
      ticker: "SOL",
      tickerName: "Solana",
      decimals: 9,
    };
  } else if (chainId === 103 || chainId === 3) {
    return {
      logo: "https://images.toruswallet.io/sol.svg",
      chainNamespace,
      chainId: "0x67",
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
  }
  if (chainId === 2) {
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
  }
  if (chainId === 3) {
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

export const getChainConfig = (
  chainNamespace: ChainNamespaceType,
  chainId?: number | string,
  web3AuthClientId?: string
): CustomChainConfig | null => {
  if (chainNamespace === CHAIN_NAMESPACES.OTHER) return null;

  const finalChainId = chainId ? (typeof chainId === "number" ? chainId : parseInt(chainId, 16)) : getDefaultNetworkId(chainNamespace);
  if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
    return getEvmChainConfig(finalChainId, web3AuthClientId);
  } else if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return getSolanaChainConfig(finalChainId);
  }
  if (chainNamespace === CHAIN_NAMESPACES.XRPL) {
    return getXrplChainConfig(finalChainId);
  }
  return null;
};
