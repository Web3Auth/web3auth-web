import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
