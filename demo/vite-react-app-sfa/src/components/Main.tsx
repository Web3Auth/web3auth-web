import { AuthLoginParams, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { useWeb3Auth } from "../services/web3auth";
import styles from "../styles/Home.module.css";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { decodeToken } from "../utils";

const Main = () => {
  const {
    provider,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    signTransaction,
    web3Auth,
    switchChain,
    enableMFA,
    manageMFA,
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

      <button onClick={logout} className={styles.card}>
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
    const { payload } = decodeToken<{ email: string }>(idToken);
    console.log(payload);

    await web3Auth?.connectTo<AuthLoginParams>(WALLET_CONNECTORS.AUTH, { 
      authConnection: "custom", 
      authConnectionId: "w3a-sfa-web-google",
      login_hint: payload.email, 
      extraLoginOptions: { 
        id_token: idToken,
        mfaLevel: "none",
      },
    });
  };

  const unloggedInView = (
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
  );

  return <div className={styles.grid}>{provider ? loggedInView : unloggedInView}</div>;
};

export default Main;
