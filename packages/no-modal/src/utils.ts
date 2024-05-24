import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/base";

export const createAddChainParams = (chainConfig: CustomChainConfig) => {
  const { chainId, displayName, chainNamespace, ticker, tickerName, decimals, rpcTarget, blockExplorerUrl, logo, wsTarget } = chainConfig;
  switch (chainNamespace) {
    case CHAIN_NAMESPACES.EIP155:
    case CHAIN_NAMESPACES.SOLANA: {
      return {
        chainId,
        chainName: displayName,
        rpcUrls: [rpcTarget],
        blockExplorerUrls: [blockExplorerUrl],
        nativeCurrency: {
          name: tickerName,
          symbol: ticker,
          decimals: decimals || 18,
        },
        iconUrls: [logo],
      };
    }
    case CHAIN_NAMESPACES.XRPL: {
      return {
        chainId,
        displayName,
        ticker,
        tickerName,
        rpcTarget,
        wsTarget,
        blockExplorerUrl,
        logo,
      };
    }
    case CHAIN_NAMESPACES.CASPER:
    case CHAIN_NAMESPACES.OTHER:
    default: {
      return chainConfig;
    }
  }
};
