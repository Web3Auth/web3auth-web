import "./App.css";

import { SafeEventEmitterProvider, WALLET_CONNECTORS, Web3AuthNoModal } from "@web3auth/no-modal";
import { useEffect, useState } from "react";

import RPC from "./web3RPC"; // for using web3.js

const clientId = "BEglQSgt4cUWcj6SKRdu5QkOXTsePmMcusG5EAoyjyOYKlVRjIF1iCNnMOTfpzCiunHRrMui8TIwQPXdkQ8Yxuk"; // get from https://dashboard.web3auth.io

function App() {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3AuthNoModal({
          clientId,
          web3AuthNetwork: "sapphire_mainnet",
          authBuildEnv: "testing",
          chains: [
            {
              chainNamespace: "eip155",
              chainId: "0xaa36a7", // Sepolia – supports EIP-7702
              rpcTarget: "https://rpc.sepolia.org",
              displayName: "Ethereum Sepolia",
              ticker: "ETH",
              tickerName: "Ethereum",
              blockExplorerUrl: "https://sepolia.etherscan.io",
              logo: "https://sepolia.etherscan.io/images/svg/brands/eth.svg",
            },
          ],
          defaultChainId: "0xaa36a7",
        });

        setWeb3auth(web3auth);

        await web3auth.init();
        if (web3auth.connectedConnectorName && web3auth.provider) {
          setProvider(web3auth.provider);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connectTo(WALLET_CONNECTORS.AUTH, { authConnection: "google" });
    setProvider(web3authProvider);
  };

  const getIdentityToken = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const idToken = await web3auth.getIdentityToken();
    uiConsole(idToken);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setLastBatchId(null);
  };

  const getChainId = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const chainId = await rpc.getChainId();
    uiConsole(chainId);
  };

  const switchChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    await web3auth?.switchChain({ chainId: "0xaa36a7" });
    uiConsole("Switched to Sepolia");
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const receipt = await rpc.sendTransaction();
    uiConsole(receipt);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const signedMessage = await rpc.signMessage();
    uiConsole(signedMessage);
  };

  const getPrivateKey = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    uiConsole(privateKey);
  };

  // ─── EIP-7702 Handlers ──────────────────────────────────────────────

  const getAccountUpgradeStatus = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.getAccountUpgradeStatus();
    uiConsole(result);
  };

  const upgradeAccount = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole("Upgrading account via EIP-7702...");
    const rpc = new RPC(provider);
    const result = await rpc.upgradeAccount();
    uiConsole(result);
  };

  // ─── EIP-5792 Handlers ──────────────────────────────────────────────

  const getCapabilities = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.getCapabilities();
    uiConsole(result);
  };

  const sendBatchCalls = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole("Sending batch calls via wallet_sendCalls (EIP-5792)...");
    const rpc = new RPC(provider);
    const batchId = await rpc.sendBatchCalls();
    if (batchId && typeof batchId === "string") {
      setLastBatchId(batchId);
    }
    uiConsole({ batchId });
  };

  const getCallsStatus = async () => {
    if (!provider || !lastBatchId) {
      uiConsole("provider not initialized or no batch ID available");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.getCallsStatus(lastBatchId);
    uiConsole(result);
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
    }
  }

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={getIdentityToken} className="card">
            Get ID Token
          </button>
        </div>
        <div>
          <button onClick={getChainId} className="card">
            Get Chain ID
          </button>
        </div>
        <div>
          <button onClick={switchChain} className="card">
            Switch to Sepolia
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={sendTransaction} className="card">
            Send Transaction
          </button>
        </div>
        <div>
          <button onClick={getPrivateKey} className="card">
            Get Private Key
          </button>
        </div>
      </div>

      {/* ── EIP-7702 Section ─────────────────────────────────────── */}
      <h3 style={{ marginTop: "2rem" }}>EIP-7702 (Account Upgrade)</h3>
      <div className="flex-container">
        <div>
          <button onClick={getAccountUpgradeStatus} className="card" style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}>
            Get Upgrade Status
          </button>
        </div>
        <div>
          <button onClick={upgradeAccount} className="card" style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}>
            Upgrade Account
          </button>
        </div>
      </div>

      {/* ── EIP-5792 Section ─────────────────────────────────────── */}
      <h3 style={{ marginTop: "2rem" }}>EIP-5792 (Batch Calls)</h3>
      <div className="flex-container">
        <div>
          <button onClick={getCapabilities} className="card" style={{ borderColor: "#10b981", color: "#10b981" }}>
            Get Capabilities
          </button>
        </div>
        <div>
          <button onClick={sendBatchCalls} className="card" style={{ borderColor: "#10b981", color: "#10b981" }}>
            Send Batch Calls
          </button>
        </div>
        <div>
          <button
            onClick={getCallsStatus}
            className="card"
            style={{ borderColor: lastBatchId ? "#10b981" : "#ccc", color: lastBatchId ? "#10b981" : "#ccc" }}
            disabled={!lastBatchId}
          >
            Get Calls Status
          </button>
        </div>
      </div>
      {lastBatchId && (
        <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
          Last Batch ID: <code>{lastBatchId}</code>
        </p>
      )}

      <div>
        <button onClick={logout} className="card" style={{ marginTop: "2rem", borderColor: "#ef4444", color: "#ef4444" }}>
          Log Out
        </button>
      </div>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="http://web3auth.io/" rel="noreferrer">
          Web3Auth{" "}
        </a>
        & ReactJS (No Modal) — EIP-7702 / 5792 Demo
      </h1>

      <div className="grid">{provider ? loggedInView : unloggedInView}</div>

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/examples/tree/master/web-no-modal-sdk/evm/react-evm-no-modal-example"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
