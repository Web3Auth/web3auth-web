import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { WALLET_CONNECTORS } from "@web3auth/no-modal";
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/no-modal/react";
import { useConnection, useSignMessage } from "wagmi";

import styles from "../styles/Home.module.css";

const Main = () => {
  const { provider, isConnected } = useWeb3Auth();
  const { connect, loading: connecting, error: connectingError, connectorName } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { isConnected: isWagmiConnected } = useConnection();
  const { signMessageAsync, data: signedMessageData } = useSignMessage();

  const loggedInView = (
    <>
      <div style={{ marginTop: "16px", marginBottom: "16px" }}>
        <p>Provider Actions</p>
        {/* Sign Message */}
        <button onClick={() => signMessageAsync({ message: "Hello, world!" })} className={styles.card}>
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

  const onGoogleLogin = async (response: CredentialResponse) => {
    console.log(response);
    const idToken = response.credential;
    if (!idToken) {
      console.error("No idToken present");
      return;
    }

    await connect(WALLET_CONNECTORS.AUTH, {
      authConnection: "custom",
      authConnectionId: "w3a-sfa-web-google",
      idToken: idToken,
      extraLoginOptions: {
        userIdField: "email",
        isUserIdCaseSensitive: false,
      },
    });
  };

  const unloggedInView = (
    <>
      {connecting ? (
        <p>Connecting...</p>
      ) : (
        <div className="flex justify-center mb-2">
          <GoogleLogin
            logo_alignment="left"
            locale="en"
            auto_select={false}
            text="continue_with"
            onSuccess={onGoogleLogin}
            size="large"
            shape="pill"
            width={window.innerWidth < 640 ? "276px" : "332px"}
          />
        </div>
      )}
      {connectingError && <p>Error: {connectingError.message}</p>}
    </>
  );

  return (
    <div className={styles.grid}>
      <p>Web3Auth: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Wagmi: {isWagmiConnected ? "Connected" : "Disconnected"}</p>
      {provider ? loggedInView : unloggedInView}
    </div>
  );
};

export default Main;
