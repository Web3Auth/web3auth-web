import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

const clientId = "BEQerr0izKMjcP6zOknM5ockI8E4HxQkiPYrj5wByHrq7lFGeS5-P1STFRSowLw9cnxF4vRWPEA38aycv0SmHgA";
const queryClient = new QueryClient();

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    useSFAKey: true,
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId
  },
};

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
