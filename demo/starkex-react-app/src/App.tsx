import "./App.css";
import { useState } from "react";
import { WEB3AUTH_NETWORK_TYPE } from "./config/web3AuthNetwork";
import { CHAIN_CONFIG_TYPE } from "./config/chainConfig";
import styles from "./styles/Home.module.css";
import { Web3AuthProvider } from "./services/web3auth";
import Setting from "./components/Setting";
import Main from "./components/Main";

function App() {
  const [web3AuthNetwork, setWeb3AuthNetwork] = useState<WEB3AUTH_NETWORK_TYPE>("testnet");
  const [chain, setChain] = useState<CHAIN_CONFIG_TYPE>("mainnet");

  return (
    <div className={styles.container}>
      <Web3AuthProvider chain={chain} web3AuthNetwork={web3AuthNetwork}>
        <h1 className={styles.title}>
          <a target="_blank" href="http://web3auth.io/" rel="noreferrer">
            Web3Auth
          </a>{" "}
          x{" "}
          <a target="_blank" href="https://github.com/starkware-libs/starkex-js" rel="noreferrer">
            StarkEx
          </a>{" "}
          <br />
          ReactJS Example
        </h1>
        <Setting selectedNetwork={web3AuthNetwork} selectedChain={chain} setNetwork={setWeb3AuthNetwork} setChain={setChain} />
        <Main />
      </Web3AuthProvider>
      <footer className={styles.footer}>
        <a href="https://github.com/Web3Auth/Web3Auth/tree/master/examples/starkex-react-app" target="_blank" rel="noopener noreferrer">
          Source code {"  "}
          <img className={styles.logo} src="/images/github-logo.png" alt="github-logo" />
        </a>
      </footer>
    </div>
  );
}

export default App;
