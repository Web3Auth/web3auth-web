import { WALLET_ADAPTERS } from "@web3auth/base";
import { useWeb3Auth } from "../services/web3auth";

import Loader from "./Loader";
import styles from "../styles/Home.module.css";

const Main = () => {
  const { user, login, logout, getUserInfo, getAccounts, getBalance, signMessage, isLoading, signTransaction, signAndSendTransaction, web3Auth, chain } = useWeb3Auth();

  const handleGoogleLogin = async () => {
    try {
      // setIsLoading(true);
      await login(WALLET_ADAPTERS.OPENLOGIN,"jwt")
    } finally {
      // setIsLoading(false);
    }
  }
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

      {
        (web3Auth?.connectedAdapterName === WALLET_ADAPTERS.OPENLOGIN || chain === "solana") &&
        (<button onClick={signTransaction} className={styles.card}>
          Sign Transaction
      </button>)
      }
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
       <div>
          <img alt="web3auth-logo" src="https://images.web3auth.io/web3auth.svg" />
        </div>
      <h3>Login With</h3>
      <button onClick={()=> handleGoogleLogin()} className={styles.card}>
       AWS Cognito
      </button>
    </div>


  );

  return isLoading ?
    (
      <div className={styles.centerFlex}>
        <Loader></Loader>
      </div>
    ): (
      <div className={styles.grid}>{user ? loggedInView : unloggedInView}</div>
    )
};

export default Main;