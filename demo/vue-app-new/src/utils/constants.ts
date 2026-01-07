import { CHAIN_NAMESPACES, ProviderConfig } from "@toruslabs/base-controllers";
import { SOLANA_CHAIN_IDS as CHAIN_IDS } from "@web3auth/ws-embed";

export const EXPLORER = "https://explorer.solana.com";

const MAINNET_RPC = import.meta.env.VITE_APP_SOLANA_MAINNET_RPC;
const TESTNET_RPC = import.meta.env.VITE_APP_SOLANA_TESTNET_RPC;
const DEVNET_RPC = import.meta.env.VITE_APP_SOLANA_DEVNET_RPC;

function rpcUrlToWsUrl(rpcUrl: string) {
  if (!rpcUrl) return;
  return rpcUrl.replace("https://", "wss://");
}

export const SOLANA_SUPPORTED_NETWORKS = {
  [CHAIN_IDS.SOLANA_MAINNET]: {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    decimals: 9,
    blockExplorerUrl: EXPLORER,
    chainId: CHAIN_IDS.SOLANA_MAINNET,
    displayName: "Solana Mainnet",
    logo: "solana.svg",
    rpcTarget: MAINNET_RPC,
    wsTarget: rpcUrlToWsUrl(MAINNET_RPC as string),
    ticker: "SOL",
    tickerName: "Solana Token",
  } as ProviderConfig,
  [CHAIN_IDS.SOLANA_TESTNET]: {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    decimals: 9,
    blockExplorerUrl: EXPLORER,
    chainId: CHAIN_IDS.SOLANA_TESTNET,
    displayName: "Solana Testnet",
    logo: "solana.svg",
    rpcTarget: TESTNET_RPC,
    wsTarget: rpcUrlToWsUrl(TESTNET_RPC as string),
    ticker: "SOL",
    tickerName: "Solana Token",
    isTestnet: true,
  } as ProviderConfig,
  [CHAIN_IDS.SOLANA_DEVNET]: {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    decimals: 9,
    blockExplorerUrl: EXPLORER,
    chainId: CHAIN_IDS.SOLANA_DEVNET,
    displayName: "Solana Devnet",
    logo: "solana.svg",
    rpcTarget: DEVNET_RPC,
    wsTarget: rpcUrlToWsUrl(DEVNET_RPC as string),
    ticker: "SOL",
    tickerName: "Solana Token",
    isTestnet: true,
  } as ProviderConfig,
} as const;
