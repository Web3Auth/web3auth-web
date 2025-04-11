import { useWeb3Auth } from "@web3auth/modal/react";
import { useEffect, useState } from "react";
import { useAccount, useConfig, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";

import styles from "../styles/Home.module.css";

const Main = () => {
  const { provider, connect, logout, isConnected, switchChain, enableMFA, manageMFA } = useWeb3Auth();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { address, isConnected: isWagmiConnected, chainId: wagmiChainId } = useAccount();
  const [web3authChainId, setWeb3authChainId] = useState<number | null>(null);
  const [web3authAddress, setWeb3authAddress] = useState<string | null>(null);
  const { switchChain: switchWagmiChain } = useSwitchChain();
  const config = useConfig();

  const fetchWeb3authAddress = async () => {
    if (provider) {
      const accounts = await provider.request<never, string[]>({ method: "eth_requestAccounts" });
      setWeb3authAddress(accounts?.[0] as string);
      return accounts?.[0];
    }
  };

  const fetchWeb3authChainId = async () => {
    if (provider) {
      const chainId = await provider.request<never, string>({ method: "eth_chainId" });
      setWeb3authChainId(parseInt(chainId as string, 16));
      return chainId;
    }
  };

  const handleSignMessage = async () => {
    const signature = await signMessageAsync({ message: "Hello, world!" });
    console.log(signature);
  };

  useEffect(() => {
    console.log("wagmi config", config);
  }, [config]);

  const loggedInView = (
    <>
      <div className={styles.grid}>
        <p>Web3Auth:</p>
        <div>Web3Auth Address: {web3authAddress}</div>
        <div>Web3Auth Chain ID: {web3authChainId}</div>
        <button onClick={fetchWeb3authAddress} className={styles.card}>
          Fetch Web3Auth Address
        </button>
        <button onClick={fetchWeb3authChainId} className={styles.card}>
          Fetch Web3Auth Chain ID
        </button>
        {/* <button onClick={getUserInfo} className={styles.card}>
        Get User Info
      </button>
      <button onClick={getAccounts} className={styles.card}>
        Get Accounts
      </button>
      <button onClick={getBalance} className={styles.card}>
        Get Balance
      </button>
      <button onClick={signMessage} className={styles.card}>
        Sign Message
      </button> */}
        <button onClick={() => switchChain({ chainId: "1" })} className={styles.card}>
          Switch Chain
        </button>
        <button onClick={() => enableMFA()} className={styles.card}>
          Enable MFA
        </button>
        <button onClick={() => manageMFA()} className={styles.card}>
          Manage MFA
        </button>
        <button onClick={() => logout()} className={styles.card}>
          Log Out
        </button>
      </div>
      <div className={styles.grid}>
        <p>Wagmi:</p>
        <div>Wagmi Address: {address}</div>
        <div>Wagmi Chain ID: {wagmiChainId}</div>
        <button onClick={() => switchWagmiChain({ chainId: 1 })} className={styles.card}>
          Switch To Ethereum Chain
        </button>
        <button onClick={() => switchWagmiChain({ chainId: 11155111 })} className={styles.card}>
          Switch To Sepolia Chain
        </button>
        <button onClick={handleSignMessage} className={styles.card}>
          Sign Message
        </button>
        <button onClick={() => disconnect()} className={styles.card}>
          Log Out
        </button>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      <button onClick={() => connect()} className={styles.card}>
        Login
      </button>
    </>
  );

  return (
    <div className={styles.grid}>
      <p>Web3Auth: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Wagmi: {isWagmiConnected ? "Connected" : "Disconnected"}</p>
      {provider || isWagmiConnected ? loggedInView : unloggedInView}
    </div>
  );
};

export default Main;
