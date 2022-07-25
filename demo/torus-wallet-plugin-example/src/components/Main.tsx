import { useWeb3Auth } from "../services/web3auth";
import styles from "../styles/Home.module.css";

const Main = () => {
  const { provider, login, showWalletConnectScanner, showDapp, showTopup, logout, getUserInfo, getAccounts, getBalance, signMessage, signV4Message } = useWeb3Auth();

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
      <button onClick={signV4Message} className={styles.card}>
        Sign v4 Message
      </button>
      <button onClick={showTopup} className={styles.card}>
        Topup
      </button>
      <button onClick={()=> showDapp("https://rarible.com")} className={styles.card}>
        Login on Rarible
      </button>
      <button onClick={showWalletConnectScanner} className={styles.card}>
        Connect Using Wallet Connect
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
    <button onClick={login} className={styles.card}>
      Login
    </button>
  );

  return <div className={styles.grid}>{provider ? loggedInView : unloggedInView}</div>;
};

export default Main;
