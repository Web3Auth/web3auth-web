import type { NextPage } from "next";
import Image from "next/image";
import { useState } from "react";
import Main from "../components/main";
import { CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import { WEB3AUTH_NETWORK_TYPE } from "../config/web3AuthNetwork";
import { Web3AuthProvider } from "../services/web3auth";
import Setting from "../components/setting";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const [web3AuthNetwork, setWeb3AuthNetwork] = useState<WEB3AUTH_NETWORK_TYPE>("mainnet");
  const [chain, setChain] = useState<CHAIN_CONFIG_TYPE>("mainnet");

  return (
    <div className={styles.container}>
      <Web3AuthProvider chain={chain} web3AuthNetwork={web3AuthNetwork}>
        <h1 className={styles.title}>
          <a target="_blank" href="http://web3auth.io/" rel="noreferrer noopener">
            Web3Auth
          </a>{" "}
          & NextJS Example
        </h1>
        <Setting setNetwork={setWeb3AuthNetwork} setChain={setChain} />
        <Main />
      </Web3AuthProvider>
      <footer className={styles.footer}>
        <a href="https://github.com/Web3Auth/Web3Auth/tree/master/demo/next-app" target="_blank" rel="noopener noreferrer">
          Source code {"  "}
          <Image className={styles.logo} src="/images/github-logo.png" alt="github logo" width={30} height={30} />
        </a>
      </footer>
    </div>
  );
};

export default Home;
