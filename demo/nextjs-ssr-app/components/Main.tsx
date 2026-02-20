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
} from "@web3auth/modal/react";
import { useState } from "react";
import { useAccount, useBalance, useChainId, useSendTransaction, useSignMessage, useSignTypedData, useSwitchChain } from "wagmi";

const Main = () => {
  const { provider, isConnected } = useWeb3Auth();
  const { chains, switchChain } = useSwitchChain();
  const chainId = useChainId();
  const { loading: connecting, connect, error: connectingError, connectorName } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { signMessageAsync, data: signedMessageData } = useSignMessage();
  const { address, isConnected: isWagmiConnected } = useAccount();
  const { userInfo, isMFAEnabled } = useWeb3AuthUser();
  const { data: balance } = useBalance({ address });
  const { signTypedData, data: signedTypedDataData } = useSignTypedData();
  const { sendTransaction, data: txHash, isPending: isSendingTx, error: sendTxError } = useSendTransaction();
  const { enableMFA, loading: isEnableMFALoading, error: enableMFAError } = useEnableMFA();
  const { manageMFA, loading: isManageMFALoading, error: manageMFAError } = useManageMFA();
  const { showCheckout, loading: isCheckoutLoading, error: checkoutError } = useCheckout();
  const { showWalletConnectScanner, loading: isWalletConnectScannerLoading, error: walletConnectScannerError } = useWalletConnectScanner();
  const { showWalletUI, loading: isWalletUILoading, error: walletUIError } = useWalletUI();
  const { token, loading: isUserTokenLoading, error: userTokenError, getIdentityToken } = useIdentityToken();

  // ─── EIP-7702 / EIP-5792 State ──────────────────────────────────────
  const [eipResult, setEipResult] = useState<string>("");
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [eipLoading, setEipLoading] = useState<string | null>(null);

  console.log("isConnected", isConnected, balance);

  // ─── EIP-7702 Handlers ──────────────────────────────────────────────

  const getAccountUpgradeStatus = async () => {
    if (!provider || !address) return;
    setEipLoading("upgradeStatus");
    try {
      const currentChainId = "0x" + chainId.toString(16);
      const result = await provider.request({
        method: "wallet_getAccountUpgradeStatus",
        params: [{ account: address, chainId: currentChainId }],
      });
      setEipResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setEipResult(JSON.stringify({ error: error?.message || error }, null, 2));
    } finally {
      setEipLoading(null);
    }
  };

  const upgradeAccount = async () => {
    if (!provider || !address) return;
    setEipLoading("upgrade");
    try {
      const currentChainId = "0x" + chainId.toString(16);
      const result = await provider.request({
        method: "wallet_upgradeAccount",
        params: [{ account: address, chainId: currentChainId }],
      });
      setEipResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setEipResult(JSON.stringify({ error: error?.message || error }, null, 2));
    } finally {
      setEipLoading(null);
    }
  };

  // ─── EIP-5792 Handlers ──────────────────────────────────────────────

  const getCapabilities = async () => {
    if (!provider || !address) return;
    setEipLoading("capabilities");
    try {
      const currentChainId = "0x" + chainId.toString(16);
      const result = await provider.request({
        method: "wallet_getCapabilities",
        params: [address, [currentChainId]],
      });
      setEipResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setEipResult(JSON.stringify({ error: error?.message || error }, null, 2));
    } finally {
      setEipLoading(null);
    }
  };

  const sendBatchCalls = async () => {
    if (!provider || !address) return;
    setEipLoading("sendBatch");
    try {
      const currentChainId = "0x" + chainId.toString(16);
      // Two simple self-transfers as a batch
      const batchId = await provider.request({
        method: "wallet_sendCalls",
        params: [
          {
            version: "2.0",
            chainId: currentChainId,
            from: address,
            calls: [
              {
                to: address,
                value: "0x0",
                data: "0x",
              },
              {
                to: address,
                value: "0x0",
                data: "0x",
              },
            ],
          },
        ],
      });
      if (batchId && typeof batchId === "string") {
        setLastBatchId(batchId);
      }
      setEipResult(JSON.stringify({ batchId }, null, 2));
    } catch (error: any) {
      setEipResult(JSON.stringify({ error: error?.message || error }, null, 2));
    } finally {
      setEipLoading(null);
    }
  };

  const getCallsStatus = async () => {
    if (!provider || !lastBatchId) return;
    setEipLoading("callsStatus");
    try {
      const result = await provider.request({
        method: "wallet_getCallsStatus",
        params: [lastBatchId],
      });
      setEipResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setEipResult(JSON.stringify({ error: error?.message || error }, null, 2));
    } finally {
      setEipLoading(null);
    }
  };

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
                <button onClick={() => getIdentityToken()} className="card">
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

          {/* Send Zero Transaction */}
          <button
            onClick={() => sendTransaction({ to: address!, value: BigInt(0) })}
            className="card"
            disabled={isSendingTx || !address}
          >
            {isSendingTx ? "Sending..." : "Send Zero Transaction"}
          </button>
          {txHash && <textarea disabled rows={2} value={`Tx Hash: ${txHash}`} style={{ width: "100%" }} />}
          {sendTxError && <p style={{ color: "red" }}>Error: {sendTxError.message}</p>}
        </div>

        {/* ── EIP-7702 Section ─────────────────────────────────────── */}
        <div style={{ marginTop: "24px", marginBottom: "16px", borderTop: "2px solid #8b5cf6", paddingTop: "16px" }}>
          <p style={{ color: "#8b5cf6", fontWeight: "bold" }}>EIP-7702 (Account Upgrade)</p>
          <button
            onClick={getAccountUpgradeStatus}
            className="card"
            style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
            disabled={eipLoading === "upgradeStatus"}
          >
            {eipLoading === "upgradeStatus" ? "Checking..." : "Get Upgrade Status"}
          </button>
          <button
            onClick={upgradeAccount}
            className="card"
            style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
            disabled={eipLoading === "upgrade"}
          >
            {eipLoading === "upgrade" ? "Upgrading..." : "Upgrade Account (EIP-7702)"}
          </button>
        </div>

        {/* ── EIP-5792 Section ─────────────────────────────────────── */}
        <div style={{ marginTop: "24px", marginBottom: "16px", borderTop: "2px solid #10b981", paddingTop: "16px" }}>
          <p style={{ color: "#10b981", fontWeight: "bold" }}>EIP-5792 (Batch Calls)</p>
          <button
            onClick={getCapabilities}
            className="card"
            style={{ borderColor: "#10b981", color: "#10b981" }}
            disabled={eipLoading === "capabilities"}
          >
            {eipLoading === "capabilities" ? "Fetching..." : "Get Capabilities"}
          </button>
          <button
            onClick={sendBatchCalls}
            className="card"
            style={{ borderColor: "#10b981", color: "#10b981" }}
            disabled={eipLoading === "sendBatch"}
          >
            {eipLoading === "sendBatch" ? "Sending..." : "Send Batch Calls (wallet_sendCalls)"}
          </button>
          <button
            onClick={getCallsStatus}
            className="card"
            style={{
              borderColor: lastBatchId ? "#10b981" : "#ccc",
              color: lastBatchId ? "#10b981" : "#ccc",
            }}
            disabled={!lastBatchId || eipLoading === "callsStatus"}
          >
            {eipLoading === "callsStatus" ? "Fetching..." : "Get Calls Status"}
          </button>
          {lastBatchId && (
            <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
              Last Batch ID: <code>{lastBatchId}</code>
            </p>
          )}
        </div>

        {/* EIP Result Console */}
        {eipResult && (
          <div style={{ marginTop: "8px", marginBottom: "16px" }}>
            <p style={{ fontWeight: "bold" }}>EIP-7702 / 5792 Result:</p>
            <textarea disabled rows={8} value={eipResult} style={{ width: "100%", fontFamily: "monospace", fontSize: "0.9rem" }} />
          </div>
        )}

        {/* Switch Chain */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Switch Chain</p>
          {chains.map((chain) => (
            <button
              key={chain.id}
              disabled={chain.id === chainId}
              onClick={() => switchChain({ chainId: chain.id })}
              style={{ opacity: chain.id === chainId ? 0.5 : 1 }}
              className="card"
            >
              {chain.name}
            </button>
          ))}
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
