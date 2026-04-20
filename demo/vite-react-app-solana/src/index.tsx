import "./index.css";

import { type Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/react";
import { SolanaProvider } from "@web3auth/modal/react/solana";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

const clientId = "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw";

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId,
    authBuildEnv: "testing",
    chains: [
      {
        chainNamespace: "solana",
        chainId: "0x67",
        rpcTarget: "https://api.devnet.solana.com",
        displayName: "Solana Devnet",
        blockExplorerUrl: "https://explorer.solana.com?cluster=devnet",
        ticker: "SOL",
        tickerName: "Solana",
        decimals: 9,
        logo: "https://images.toruswallet.io/sol.svg",
      },
    ],
    defaultChainId: "0x67",
  },
};

root.render(
  <StrictMode>
    <Web3AuthProvider config={web3authConfig}>
      <SolanaProvider>
        <App />
      </SolanaProvider>
    </Web3AuthProvider>
  </StrictMode>
);
