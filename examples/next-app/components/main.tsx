import { useWeb3Auth } from "../services/web3auth";
import styles from "../styles/Home.module.css";

const Main = () => {
  const { provider, login, logout, getUserInfo, getAccounts, getBalance, signEthMessage } = useWeb3Auth();

  const loggedInView = (
    <>
      <a onClick={getUserInfo} className={styles.card}>
        Get User Info
      </a>
      <a onClick={getAccounts} className={styles.card}>
        Get Accounts
      </a>
      <a onClick={getBalance} className={styles.card}>
        Get Balance
      </a>
      <a onClick={signEthMessage} className={styles.card}>
        Sign Message
      </a>
      <a onClick={logout} className={styles.card}>
        Log Out
      </a>

      <div className={styles.console} id="console">
        <p className={styles.code}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <a onClick={login} className={styles.card}>
      Login
    </a>
  );

  return <div className={styles.grid}>{provider ? loggedInView : unloggedInView}</div>;
};

export default Main;
