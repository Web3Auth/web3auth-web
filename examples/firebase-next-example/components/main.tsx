import { useWeb3Auth } from "../services/web3auth";
import styles from "../styles/Home.module.css";
import { WALLET_ADAPTERS } from "@web3auth/base";
import { signInWithGoogle } from "../services/firebaseAuth";
import { useState } from "react";
import { UserCredential } from "firebase/auth";

const Main = () => {
  const { provider, login, logout, getUserInfo, getAccounts, getBalance, signMessage, signTransaction, signAndSendTransaction, web3Auth, chain } = useWeb3Auth();
  const [userCreds, setUserCredentials] = useState<UserCredential | null>(null);
  const loginWithFirebase = async () => {
    const loginRes = await signInWithGoogle();
    setUserCredentials(loginRes);
    
  }
  const connectOpenlogin = async () => {
    if (!userCreds)  throw new Error("login with firebase first");
    const idToken = await userCreds.user.getIdToken(true);
    console.log("idToken", idToken);
    await login("jwt", idToken)
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
    <div className={styles.grid}>
    {
      userCreds ?  <button onClick={connectOpenlogin} className={styles.card}>
       Connect Openlogin
    </button> :
     <button onClick={loginWithFirebase} className={styles.card}>
     Login With Firebase
     </button>
    }

    </div>
  );

  return <div className={styles.grid}>{provider ? loggedInView : unloggedInView}</div>;
};


export default Main;
