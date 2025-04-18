import { CONNECTOR_STATUS, WALLET_CONNECTORS } from "@web3auth/modal";
import { useWeb3Auth } from "../services/web3auth";
import styles from "../styles/Home.module.css";

const Main = () => {
  const {
    provider,
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    signTransaction,
    web3Auth,
    showWalletUi,
    switchChain,
    showWalletConnectScanner,
    enableMFA,
    manageMFA,
    isReady,
  } = useWeb3Auth();

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
      <button onClick={switchChain} className={styles.card}>
        Switch Chain
      </button>
      <button onClick={enableMFA} className={styles.card}>
        Enable MFA
      </button>
      <button onClick={manageMFA} className={styles.card}>
        Manage MFA
      </button>
      {web3Auth?.connectedConnectorName === WALLET_CONNECTORS.AUTH && (
        <button onClick={signTransaction} className={styles.card}>
          Sign Transaction
        </button>
      )}

      <button onClick={showWalletUi} className={styles.card}>
        Show Wallet UI
      </button>

      <button onClick={showWalletConnectScanner} className={styles.card}>
        Show WalletConnect Scanner
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
    <>
      {isReady ? (
        <button onClick={login} className={styles.card}>
          Login
        </button>
      ) : (
        <p>Loading Web3Auth...</p>
      )}
    </>
  );

  return <div className={styles.grid}>{provider ? loggedInView : unloggedInView}</div>;
};

export default Main;
