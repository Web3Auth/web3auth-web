"use client";

import {
  useCheckout,
  useEnableMFA,
  useIdentityToken,
  useManageMFA,
  useWalletConnectScanner,
  useWalletUI,
  useWeb3Auth,
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
  useWeb3AuthUser,
} from "web3auth/react";
import { useAccount, useBalance, useSignMessage, useSignTypedData } from "wagmi";

const Main = () => {
  const { provider, isConnected } = useWeb3Auth();
  const { loading: connecting, connect, error: connectingError, connectorName } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { signMessageAsync, data: signedMessageData } = useSignMessage();
  const { address, isConnected: isWagmiConnected } = useAccount();
  const { userInfo, isMFAEnabled } = useWeb3AuthUser();
  const { data: balance } = useBalance({ address });
  const { signTypedData, data: signedTypedDataData } = useSignTypedData();
  const { enableMFA, loading: isEnableMFALoading, error: enableMFAError } = useEnableMFA();
  const { manageMFA, loading: isManageMFALoading, error: manageMFAError } = useManageMFA();
  const { showCheckout, loading: isCheckoutLoading, error: checkoutError } = useCheckout();
  const { showWalletConnectScanner, loading: isWalletConnectScannerLoading, error: walletConnectScannerError } = useWalletConnectScanner();
  const { showWalletUI, loading: isWalletUILoading, error: walletUIError } = useWalletUI();
  const { token, loading: isUserTokenLoading, error: userTokenError, authenticateUser } = useIdentityToken();
 
  console.log("isConnected", isConnected);
  
  const loggedInView = (
    <>
      <div className="container">
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          {/* <p>Account Address: {address}</p> */}
          {/* <p>Account Balance: {balance?.value}</p> */}
          <p>MFA Enabled: {isMFAEnabled ? "Yes" : "No"}</p>
        </div>

        {/* User Info */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>User Info</p>
          <textarea disabled rows={5} value={JSON.stringify(userInfo, null, 2)} style={{ width: "100%" }} />
        </div>

        {/* User Token */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>User Token</p>
          {token && <textarea disabled rows={5} value={token} style={{ width: "100%" }} />}
          {!token && (
            <>
              {isUserTokenLoading ? (
                <p>Authenticating...</p>
              ) : (
                <button onClick={() => authenticateUser()} className="card">
                  Authenticate User
                </button>
              )}
            </>
          )}
          {userTokenError && <p>Error: {userTokenError.message}</p>}
        </div>

        {/* MFA */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>MFA</p>
          {isMFAEnabled ? (
            <>
              {isManageMFALoading ? (
                <p>Managing MFA...</p>
              ) : (
                <button onClick={() => manageMFA()} className="card">
                  Manage MFA
                </button>
              )}
              {manageMFAError && <p>Error: {manageMFAError.message}</p>}
            </>
          ) : (
            <>
              {isEnableMFALoading ? (
                <p>Enabling MFA...</p>
              ) : (
                <button onClick={() => enableMFA()} className="card">
                  Enable MFA
                </button>
              )}
              {enableMFAError && <p>Error: {enableMFAError.message}</p>}
            </>
          )}
        </div>

        {/* Checkout */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Checkout</p>
          {isCheckoutLoading ? (
            <p>Checking out...</p>
          ) : (
            <button onClick={() => showCheckout()} className="card">
              Checkout
            </button>
          )}
          {checkoutError && <p>Error: {checkoutError.message}</p>}
        </div>

        {/* Wallet Connect Scanner */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Wallet Connect Scanner</p>
          {isWalletConnectScannerLoading ? (
            <p>Scanning...</p>
          ) : (
            <button onClick={() => showWalletConnectScanner()} className="card">
              Scan
            </button>
          )}
          {walletConnectScannerError && <p>Error: {walletConnectScannerError.message}</p>}
        </div>

        {/* Wallet UI */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Wallet UI</p>
          {isWalletUILoading ? (
            <p>Loading...</p>
          ) : (
            <button onClick={() => showWalletUI()} className="card">
              Wallet UI
            </button>
          )}
          {walletUIError && <p>Error: {walletUIError.message}</p>}
        </div>

        {/* Provider Actions */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Provider Actions</p>
          {/* Sign Message */}
          <button onClick={() => signMessageAsync({ message: "Hello, world!" })} className="card">
            Sign Message
          </button>
          {signedMessageData && <textarea disabled rows={5} value={signedMessageData} style={{ width: "100%" }} />}

          {/* Sign Typed Data */}
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
            className="card"
          >
            Sign Typed Data
          </button>
          {signedTypedDataData && <textarea disabled rows={5} value={signedTypedDataData} style={{ width: "100%" }} />}
        </div>

        {/* Disconnect */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Logout</p>
          <button onClick={() => disconnect()} className="card">
            Disconnect
          </button>
        </div>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      {connecting ? (
        <p>Connecting to {connectorName}...</p>
      ) : (
        <button onClick={() => connect()} className="card">
          Login
        </button>
      )}
      {connectingError && <p>Error: {connectingError.message}</p>}
    </>
  );

  return (
    <div className="grid">
      <p>Web3Auth: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Wagmi: {isWagmiConnected ? "Connected" : "Disconnected"}</p>
      {provider ? loggedInView : unloggedInView}
    </div>
  );
};

export default Main;
