import { useBalance, useSolTransfer } from "@solana/react-hooks";
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useSignMessage, useSolanaWallet } from "@web3auth/modal/react/solana";
import { useEffect, useState } from "react";

import styles from "../styles/Home.module.css";

const LAMPORTS_PER_SOL = 1_000_000_000n;

const Main = () => {
  const { isConnected, isInitialized } = useWeb3Auth();
  const { connect } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { data: signedMessageData, signMessage } = useSignMessage();
  const { accounts } = useSolanaWallet();
  const { lamports, fetching: balanceFetching } = useBalance(accounts?.[0]);
  const { send: sendSol, signature: solTransferSig, status: solTransferStatus, error: solTransferError, isSending } = useSolTransfer();
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    if (accounts?.[0] && !recipient) {
      setRecipient(accounts[0]);
    }
  }, [accounts, recipient]);

  const balanceInSol = lamports != null ? Number(lamports) / Number(LAMPORTS_PER_SOL) : null;

  const handleSendSol = async () => {
    if (!recipient) return;
    await sendSol({ amount: 1_000_000n, destination: recipient });
  };

  const loggedInView = (
    <>
      <div style={{ marginTop: "16px", marginBottom: "16px" }}>
        {accounts?.[0] && <p>Address: {accounts[0]}</p>}
        <p>Balance: {balanceFetching ? "Loading..." : balanceInSol != null ? `${balanceInSol.toFixed(6)} SOL` : "—"}</p>

        <p>Provider Actions</p>

        <button onClick={() => signMessage("Hello, world!")} className={styles.card}>
          Sign Message
        </button>
        {signedMessageData && <textarea disabled rows={3} value={signedMessageData} style={{ width: "100%" }} />}

        <div style={{ marginTop: "16px" }}>
          <p>Send SOL (0.001 SOL)</p>
          <input
            type="text"
            placeholder="Recipient address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
          />
          <button onClick={handleSendSol} disabled={isSending || !recipient} className={styles.card}>
            {isSending ? "Sending..." : "Send 0.001 SOL"}
          </button>
          {solTransferSig && <p>Signature: {solTransferSig}</p>}
          {solTransferStatus === "error" && <p style={{ color: "red" }}>Error: {String(solTransferError)}</p>}
        </div>
      </div>

      <button onClick={() => disconnect()} className={styles.card}>
        Log Out
      </button>
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

  return <div className={styles.grid}>{isConnected ? loggedInView : unloggedInView}</div>;
};

export default Main;
