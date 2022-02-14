import type { NextPage } from "next";

import { useState, Suspense, ChangeEvent } from "react";
import { Web3AuthProvider } from "../services/web3auth";
import { WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE } from "../config/web3AuthNetwork";
import { CHAIN_CONFIG_TYPE } from "../config/chainConfig";

const Home: NextPage = () => {
  const [web3AuthNetwork, setWeb3AuthNetwork] = useState<WEB3AUTH_NETWORK_TYPE>("mainnet");
  const [chain, setChain] = useState<CHAIN_CONFIG_TYPE>("mainnet");
  const web3AuthChangeHandler = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
    setWeb3AuthNetwork(e.target.value as WEB3AUTH_NETWORK_TYPE);
  };
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <Web3AuthProvider chain={chain} web3AuthNetwork={web3AuthNetwork}>
        <h1>Hello World</h1>
        <select onChange={web3AuthChangeHandler}>
          {Object.keys(WEB3AUTH_NETWORK).map((x: string) => {
            return <option value={x}>{WEB3AUTH_NETWORK[x as WEB3AUTH_NETWORK_TYPE].displayName}</option>;
          })}
        </select>
      </Web3AuthProvider>
    </Suspense>
  );
};

export default Home;
