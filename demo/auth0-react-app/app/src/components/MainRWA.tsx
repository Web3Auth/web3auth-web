import { WALLET_ADAPTERS } from "@web3auth/base";
import { useWeb3Auth } from "../services/web3auth";

import Loader from "./Loader";
import styles from "../styles/Home.module.css";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const Main = () => {
  const {
    provider,
    loginRWA,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    isLoading,
    signTransaction,
    signAndSendTransaction,
    chain,
    web3Auth,
    setIsLoading,
    isWeb3AuthInit,
  } = useWeb3Auth();
  const search = useLocation().search;
  const jwt = new URLSearchParams(search).get("token");
  const token = jwt == null ? "" : jwt;

  const handleAuthLogin = async () => {
    try {
      setIsLoading(true);
      await loginRWA(WALLET_ADAPTERS.OPENLOGIN, "jwt", token);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleAuthLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeb3AuthInit]);

  const loggedInView = (
    <>
      <button onClick={getUserInfo} className={styles.card}>
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
      </button>

      {(web3Auth?.connectedAdapterName === WALLET_ADAPTERS.OPENLOGIN || chain === "solana") && (
        <button onClick={signTransaction} className={styles.card}>
          Sign Transaction
        </button>
      )}
      <button onClick={signAndSendTransaction} className={styles.card}>
        Sign and Send Transaction
      </button>
      <button onClick={logout} className={styles.card}>
        Log Out
      </button>

      <div className={styles.console} id="console">
        <p className={styles.code}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <div className={styles.centerFlex}>
      <Loader />
      <button onClick={handleAuthLogin} className={styles.rwabtn} id="rwaLogin">
        Verify Token with web3auth
      </button>
    </div>
  );
  return isLoading ? (
    <div className={styles.centerFlex}>
      <Loader></Loader>
    </div>
  ) : (
    <div className={styles.grid}>{provider ? loggedInView : unloggedInView}</div>
  );
};

export default Main;
