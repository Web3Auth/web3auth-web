import "./App.css";

import { BUILD_ENV } from "@web3auth/auth";
import { CHAIN_NAMESPACES } from "@web3auth/modal";
import { type Web3AuthContextConfig, Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { useMemo, useState } from "react";

import Main from "./components/Main";
import styles from "./styles/Home.module.css";

const clientId = "BNJiiG6wVmiMMzApYoCbfD2xU0xxh3cp-t94tgKdwWEuf8Z5DOufWs4SnYiTqdqdA6-pTReQkaiI6z-y9rHxTIM";

const chains: Web3AuthContextConfig["web3AuthOptions"]["chains"] = [
  {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x1",
    rpcTarget: "https://rpc.ankr.com/eth",
    displayName: "Ethereum Mainnet",
    ticker: "ETH",
    tickerName: "Ethereum",
    blockExplorerUrl: "https://etherscan.io",
    logo: "https://etherscan.io/images/svg/brands/eth.svg",
  },
  {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x14a34",
    rpcTarget: "https://sepolia.base.org",
    displayName: "Base Sepolia",
    ticker: "ETH",
    tickerName: "Ethereum",
    blockExplorerUrl: "https://sepolia.basescan.org",
    logo: "https://sepolia.basescan.org/images/svg/brands/base.svg",
  },
];

const consentConfig = {
  required: true,
  privacyPolicy: "https://example.com/privacy",
  tncLink: "https://example.com/terms",
};

type ConsentConfigMode = "disabled" | "required";

function App() {
  const [consentConfigMode, setConsentConfigMode] = useState<ConsentConfigMode>("disabled");

  const web3authConfig = useMemo<Web3AuthContextConfig>(() => {
    const web3AuthOptions: Web3AuthContextConfig["web3AuthOptions"] = {
      enableLogging: true,
      web3AuthNetwork: "sapphire_devnet",
      clientId,
      authBuildEnv: BUILD_ENV.TESTING,
      chains,
    };

    if (consentConfigMode === "required") {
      web3AuthOptions.uiConfig = {
        consentConfig,
      };
    }

    return { web3AuthOptions };
  }, [consentConfigMode]);

  return (
    <div className={styles.container}>
      <Web3AuthProvider config={web3authConfig}>
        <WagmiProvider>
          <Main consentConfigMode={consentConfigMode} onConsentConfigModeChange={(value: ConsentConfigMode) => setConsentConfigMode(value)} />
        </WagmiProvider>
      </Web3AuthProvider>
    </div>
  );
}

export default App;
