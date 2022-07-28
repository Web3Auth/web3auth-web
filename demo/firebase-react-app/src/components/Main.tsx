import { WALLET_ADAPTERS } from "@web3auth/base";
import { useWeb3Auth } from "../services/web3auth";
import { signInWithGoogle } from "../services/firebaseAuth";

import Loader from "./Loader";
import styles from "../styles/Home.module.css";

const Main = () => {
  const { provider, login, logout, getUserInfo, getAccounts, getBalance, signMessage, isLoading, signTransaction, signAndSendTransaction, web3Auth, chain, setIsLoading } = useWeb3Auth();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const loginRes = await signInWithGoogle();
      console.log("login details", loginRes);
      const idToken = await loginRes.user.getIdToken(true);
      console.log("idToken", idToken);
      await login(WALLET_ADAPTERS.OPENLOGIN,"jwt", idToken)
    } finally {
      setIsLoading(false);
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
          <img src="https://images.web3auth.io/web3auth.svg" />
        </div>
      <h3>Login With</h3>
      <button onClick={()=> handleGoogleLogin()} className={styles.card}>
        Google
      </button>
    </div>
  
    
  );

  return isLoading ?
    (
      <div className={styles.centerFlex}>
        <Loader></Loader>
      </div>
    ): (
      <div className={styles.grid}>{provider ? loggedInView : unloggedInView}</div>
    )
};

export default Main;