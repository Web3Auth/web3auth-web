import type { NextPage } from "next";
import { useState, ChangeEvent } from "react";

import { Web3AuthProvider } from "../services/web3auth";
import { WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE } from "../config/web3AuthNetwork";
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import Login from "./login";

const Home: NextPage = () => {
  const [web3AuthNetwork, setWeb3AuthNetwork] = useState<WEB3AUTH_NETWORK_TYPE>("mainnet");
  const [chain, setChain] = useState<CHAIN_CONFIG_TYPE>("mainnet");
  const web3AuthChangeHandler = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
    setWeb3AuthNetwork(e.target.value as WEB3AUTH_NETWORK_TYPE);
  };
  const chainChangeHandler = (e: ChangeEvent<HTMLSelectElement>) => {
    setChain(e.target.value as CHAIN_CONFIG_TYPE);
  };
  return (
    <Web3AuthProvider chain={chain} web3AuthNetwork={web3AuthNetwork}>
      <h1>Next JS Example</h1>
      <div>
        <select onChange={web3AuthChangeHandler}>
          {Object.keys(WEB3AUTH_NETWORK).map((x: string) => {
            return (
              <option key={x} value={x}>
                {WEB3AUTH_NETWORK[x as WEB3AUTH_NETWORK_TYPE].displayName}
              </option>
            );
          })}
        </select>
      </div>
      <br />
      <div>
        <select onChange={chainChangeHandler}>
          {Object.keys(CHAIN_CONFIG).map((x: string) => {
            return (
              <option key={x} value={x}>
                {CHAIN_CONFIG[x as CHAIN_CONFIG_TYPE].displayName}
              </option>
            );
          })}
        </select>
      </div>
      <br />
      <Login />
    </Web3AuthProvider>
  );
};

export default Home;
