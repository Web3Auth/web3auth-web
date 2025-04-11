import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/modal";
import { type Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { mainnet, sepolia } from "wagmi/chains";

import App from "./App";
import { getChainConfig } from "./chainconfig";

const queryClient = new QueryClient();
const clientId = "BKZDJP0ouZP0PtfQYssMiezINbUwnIthw6ClTtTICvh0MCRgAxi5GJbHKH9cjM6xyWxe73c6c94ASCTxbGNLUt8";
const mainnetChainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, mainnet.id, clientId) as CustomChainConfig;
const sepoliaChainConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, sepolia.id, clientId) as CustomChainConfig;

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId,
    chains: [mainnetChainConfig, sepoliaChainConfig],
    defaultChainId: sepoliaChainConfig.chainId,
    authBuildEnv: "testing",
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
