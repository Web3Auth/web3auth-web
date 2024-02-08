import { useEffect, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { CHAIN_NAMESPACES, CustomChainConfig, SafeEventEmitterProvider, WALLET_ADAPTERS, getEvmChainConfig } from "@web3auth/base";
import { OpenloginAdapter, OpenloginLoginParams } from "@web3auth/openlogin-adapter";
// import { TorusWalletAdapter } from "@web3auth/torus-evm-adapter";
// import { CoinbaseAdapter } from "@web3auth/coinbase-adapter";
import "./App.css";
import RPC from "./web3RPC"; // for using web3.js;
import { FarcasterAdapter } from "@web3auth/farcaster-adapter";
//import RPC from "./ethersRPC"; // for using ethers.js
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import FarcasterLogin from "./components/FarcasterLogin";

const clientId = "BIu6q5W2xQr6xhyX6TMjshAJHUtbYH_ICmgHaAjr7bB9UyV1NJTgwWtS6F6-YVgOzLFfofMzQq55FtOgP_osvU4"; // get from https://dashboard.web3auth.io
const web3AuthNetwork = "sapphire_devnet";

function App() {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [showFarcasterLogin, setShowFarcasterLogin] = useState<boolean>(false);
  const [farcasterConnectUri, setFarcasterConnectUri] = useState<string>("");
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3AuthNoModal({
          clientId,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
          },
          web3AuthNetwork,
        });

        (function () {
          if (!web3auth) {
            uiConsole("web3auth not initialized yet");
            return;
          }
          console.log("subscribed to adapter events");
          web3auth.on("adapter_data_updated", ({ adapter, data }) => {
            console.log("adapter_data_updated", data);
            setShowFarcasterLogin(data.farcasterLogin);
            setFarcasterConnectUri(data.farcasterConnectUri);
            setLoading(false);
          });
          web3auth.on("ready", (data) => {
            console.log("adapter ready", data);
          });
          web3auth.on("connecting", (data) => {
            console.log("adapter connecting", data);
          });
          web3auth.on("connected", (data) => {
            console.log("adapter connected", data);
            setLoggedIn(true);
            setShowFarcasterLogin(false);
          });
          web3auth.on("ERRORED", (data) => {
            console.log("adapter ERRORED", data);
            setLoading(false);
          });
        })()

        setWeb3auth(web3auth);

        const openloginAdapter = new OpenloginAdapter({
          privateKeyProvider: new EthereumPrivateKeyProvider({
            config: {
              chainConfig: getEvmChainConfig(1) as CustomChainConfig,
            },
          }),
        });
        web3auth.configureAdapter(openloginAdapter);

        const adapter = new FarcasterAdapter({
          privateKeyProvider: new EthereumPrivateKeyProvider({
            config: {
              chainConfig: getEvmChainConfig(1) as CustomChainConfig,
            },
          }),
          web3AuthNetwork: web3AuthNetwork,
          clientId,
        });
        web3auth.configureAdapter(adapter);

        await web3auth.init();
        if (web3auth.connectedAdapterName && web3auth.provider) {
          setProvider(web3auth.provider);
        }
      } catch (error) {
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
    const web3authProvider = await web3auth.connectTo<OpenloginLoginParams>(WALLET_ADAPTERS.OPENLOGIN, { loginProvider: "google" });
    setProvider(web3authProvider);
    setLoggedIn(true);
  };

  const loginWithFarcaster = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    console.log("login with farcaster!")
    setLoading(true);
    const web3authProvider = await web3auth?.connectTo(WALLET_ADAPTERS.FARCASTER, { loginProvider: "jwt" });
    setProvider(web3authProvider);
  }

  const authenticateUser = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const idToken = await web3auth.authenticateUser();
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
    setLoggedIn(false);
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

  const addChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const newChain = {
      chainId: "0x5",
      displayName: "Goerli",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      tickerName: "Goerli",
      ticker: "ETH",
      decimals: 18,
      rpcTarget: "https://rpc.ankr.com/eth_goerli",
      blockExplorer: "https://goerli.etherscan.io",
    };
    await web3auth?.addChain(newChain);
    uiConsole("New Chain Added");
  };

  const switchChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    await web3auth?.switchChain({ chainId: "0x5" });
    uiConsole("Chain Switched");
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
          <button onClick={authenticateUser} className="card">
            Get ID Token
          </button>
        </div>
        <div>
          <button onClick={getChainId} className="card">
            Get Chain ID
          </button>
        </div>
        <div>
          <button onClick={addChain} className="card">
            Add Chain
          </button>
        </div>
        <div>
          <button onClick={switchChain} className="card">
            Switch Chain
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
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      <button onClick={login} className="card">
        Login
      </button>
      <button onClick={loginWithFarcaster} className="card" disabled={loading}>
        { loading ? "loading..." : "Login with farcaster"}
      </button>
    </>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="http://web3auth.io/" rel="noreferrer">
          Web3Auth{" "}
        </a>
        & ReactJS Example
      </h1>
      {
        showFarcasterLogin
          ? <FarcasterLogin connectUri={farcasterConnectUri} goback={() => setShowFarcasterLogin(false)}/>
          : <div className="grid">{provider && loggedIn ? loggedInView : unloggedInView}</div>
      }

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
