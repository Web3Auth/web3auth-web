import "./index.css";

import { type Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

const clientId = "BIkhKhVq14WkcoGDNkOpaVB3vhBDANPzD0oVQzCmnoCz83z2WrKwtiROqA6J9d6UZdX4hifg9z1hI3fuQMfwMc8";

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId,
    authBuildEnv: "testing",
  },
};

root.render(
  <StrictMode>
    <Web3AuthProvider config={web3authConfig}>
      <App />
    </Web3AuthProvider>
  </StrictMode>
);
