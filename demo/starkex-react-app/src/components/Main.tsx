import { useWeb3Auth } from "../services/web3auth";
import styles from "../styles/Home.module.css";

const Main = () => {
  const { provider, login, logout, getUserInfo, getStarkAccount, getStarkKey, onMintRequest, onDepositRequest, onWithdrawalRequest } = useWeb3Auth();

  const loggedInView = (
    <>
      <button onClick={getUserInfo} className={styles.card}>
        Get User Info
      </button>
      <button onClick={getStarkAccount} className={styles.card}>
        Get Stark Accounts
      </button>
      <button onClick={getStarkKey} className={styles.card}>
        Get Stark Key
      </button>
      <button onClick={onMintRequest} className={styles.card}>
        Mint Request
      </button>
      <button onClick={onDepositRequest} className={styles.card}>
        Deposit Request
      </button>
      <button onClick={onWithdrawalRequest} className={styles.card}>
        Withdraw Request
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
