import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BUILD_ENV, CHAIN_NAMESPACES } from "@web3auth/auth";
import { type Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const queryClient = new QueryClient();
const clientId = "BNJiiG6wVmiMMzApYoCbfD2xU0xxh3cp-t94tgKdwWEuf8Z5DOufWs4SnYiTqdqdA6-pTReQkaiI6z-y9rHxTIM";

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId,
    authBuildEnv: BUILD_ENV.TESTING,
    chains: [
      {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x1", // Ethereum Mainnet
        rpcTarget: "https://rpc.ankr.com/eth",
        displayName: "Ethereum Mainnet",
        ticker: "ETH",
        tickerName: "Ethereum",
        blockExplorerUrl: "https://etherscan.io",
        logo: "https://etherscan.io/images/svg/brands/eth.svg",
      },
      /**
       * Needed for testing x402 payments on Base Sepolia
       */
      {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x14a34", // Base Sepolia (84532)
        rpcTarget: "https://sepolia.base.org",
        displayName: "Base Sepolia",
        ticker: "ETH",
        tickerName: "Ethereum",
        blockExplorerUrl: "https://sepolia.basescan.org",
        logo: "https://sepolia.basescan.org/images/svg/brands/base.svg",
      },
    ],
  },
};

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

root.render(
  <StrictMode>
    <Web3AuthProvider config={web3authConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>
          <App />
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  </StrictMode>
);
