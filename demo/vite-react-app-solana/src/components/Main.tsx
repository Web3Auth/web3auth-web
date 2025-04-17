import { WALLET_CONNECTORS } from "@web3auth/modal";
import styles from "../styles/Home.module.css";
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import {  useSignMessage } from "@web3auth/modal/react/solana";

const Main = () => {
  const {
    provider,
    isInitialized,
  } = useWeb3Auth();
  const { connect } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { data: signedMessageData, signMessage } = useSignMessage();


  const loggedInView = (
    <>
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Provider Actions</p>
          {/* Sign Message */}
          <button onClick={() => signMessage("Hello, world!")} className={styles.card}>
            Sign Message
          </button>
          {signedMessageData && <textarea disabled rows={5} value={signedMessageData} style={{ width: "100%" }} />}
        </div>

      <button onClick={() => disconnect()} className={styles.card}>
        Log Out
      </button>

      <div className={styles.console} id="console">
        <p className={styles.code}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      {isInitialized ? (
        <button onClick={() => connect()} className={styles.card}>
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
