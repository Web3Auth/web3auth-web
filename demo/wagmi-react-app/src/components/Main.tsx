import { useWeb3Auth } from "@web3auth/modal/react";
import { useAccount, useBalance, useDisconnect, useSignMessage, useSignTypedData } from "wagmi";

import styles from "../styles/Home.module.css";

const Main = () => {
  const { provider, connect, isConnected } = useWeb3Auth();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, data: signedMessageData } = useSignMessage();
  const { address, isConnected: isWagmiConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { signTypedData, data: signedTypedDataData } = useSignTypedData();

  const loggedInView = (
    <>
      <div className={styles.container}>
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Account Address: {address}</p>
          <p>Account Balance: {balance?.value}</p>
        </div>

        {/* Sign Message */}
        <button onClick={() => signMessageAsync({ message: "Hello, world!" })} className={styles.card}>
          Sign Message
        </button>
        {signedMessageData && <textarea disabled rows={5} value={signedMessageData} style={{ width: "100%" }} />}

        {/* Send Transaction */}
        <button
          onClick={() =>
            signTypedData({
              types: {
                Person: [
                  { name: "name", type: "string" },
                  { name: "wallet", type: "address" },
                ],
                Mail: [
                  { name: "from", type: "Person" },
                  { name: "to", type: "Person" },
                  { name: "contents", type: "string" },
                ],
              },
              primaryType: "Mail",
              message: {
                from: {
                  name: "Cow",
                  wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
                },
                to: {
                  name: "Bob",
                  wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
                },
                contents: "Hello, Bob!",
              },
            })
          }
          className={styles.card}
        >
          Sign Typed Data
        </button>
        {signedTypedDataData && <textarea disabled rows={5} value={signedTypedDataData} style={{ width: "100%" }} />}

        {/* Disconnect */}
        <button onClick={() => disconnect()} className={styles.card}>
          Disconnect
        </button>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      <button onClick={() => connect()} className={styles.card}>
        Login
      </button>
    </>
  );

  return (
    <div className={styles.grid}>
      <p>Web3Auth: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Wagmi: {isWagmiConnected ? "Connected" : "Disconnected"}</p>
      {provider || isWagmiConnected ? loggedInView : unloggedInView}
    </div>
  );
};

export default Main;
