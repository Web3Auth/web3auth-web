import { CustomChainConfig, CHAIN_NAMESPACES } from "@web3auth/modal";

export const CHAIN_CONFIG = {
  mainnet: {
    displayName: "Ethereum Mainnet",
    chainId: "0x1",
    rpcTarget: `https://rpc.ankr.com/eth`,
    blockExplorerUrl: "https://etherscan.io/",
    ticker: "ETH",
    tickerName: "Ethereum",
    logo: "https://images.toruswallet.io/eth.svg",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
  } as CustomChainConfig,
  polygon: {
    rpcTarget: "https://rpc.ankr.com/polygon",
    blockExplorerUrl: "https://polygonscan.com/",
    chainId: "0x89",
    displayName: "Polygon Mainnet",
    ticker: "POL",
    tickerName: "Polygon Ecosystem Token",
    logo: "https://images.toruswallet.io/matic.svg",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
  } as CustomChainConfig,
  "polygon-amoy": {
    rpcTarget: "https://rpc.ankr.com/polygon_amoy",
    blockExplorerUrl: "https://amoy.polygonscan.com/",
    chainId: "0x13882",
    displayName: "Polygon Amoy Testnet",
    ticker: "POL",
    tickerName: "Polygon Ecosystem Token",
    logo: "https://images.toruswallet.io/matic.svg",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
  } as CustomChainConfig,
  sepolia: {
    chainId: "0xaa36a7",
    rpcTarget: "https://rpc.ankr.com/eth_sepolia",
    displayName: "Sepolia Testnet",
    blockExplorerUrl: "https://sepolia.etherscan.io/",
    ticker: "eth",
    tickerName: "Ethereum",
    logo: "https://images.toruswallet.io/eth.svg",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
  } as CustomChainConfig,
  arbitrum_sepolia: {
    rpcTarget: "https://arbitrum-sepolia.infura.io/v3/4efda295156d477f959dcef8ebc33c5f",
    blockExplorerUrl: "https://sepolia.arbiscan.io/",
    chainId: "0x66eee",
    displayName: "Arbitrum Sepolia",
    ticker: "eth",
    tickerName: "Eth",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    logo: "https://images.toruswallet.io/arbitrum.svg",
  } as CustomChainConfig,
} as const;

export type CHAIN_CONFIG_TYPE = keyof typeof CHAIN_CONFIG;
