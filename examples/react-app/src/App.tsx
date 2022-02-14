import "./App.css";
import { Web3Auth } from "@web3auth/web3auth";
import { ADAPTER_EVENTS } from "@web3auth/base";
import { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
import { useEffect, useState } from "react";
import { useWeb3Auth } from "./components/Web3AuthProvider";

function App() {
  const [user, setUser] = useState(null);
  const web3auth = useWeb3Auth();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log("useEffect");

    const subscribeAuthEvents = (web3auth: Web3Auth) => {
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data) => {
        console.log("Yeah!, you are successfully logged in", data);
        setUser(data);
      });

      web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        setUser(null);
      });

      web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
        console.log("some error or user have cancelled login request", error);
      });

      web3auth.on(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (isVisible) => {
        console.log("modal visibility", isVisible);
      });
    };

    // ⭐️ initialize modal on page mount.
    const initializeModal = async () => {
      console.log("initializeModal");
      subscribeAuthEvents(web3auth);
      await web3auth.initModal();
      setLoaded(true);
    };

    initializeModal();
  }, []);

  const login = async () => {
    const provider = await web3auth.connect();
    // TODO: add this provider to web3/ethers
  };
  const logout = async () => {
    await web3auth.logout();
  };

  const getUserInfo = async () => {
    const userInfo = await web3auth.getUserInfo();
    console.log(userInfo);
  };

  const renderUnauthenticated = () => {
    return (
      <div className="App">
        <button className="app-link" onClick={login}>
          LOGIN
        </button>
      </div>
    );
  };

  const renderAuthenticated = () => {
    return (
      <div className="App">
        <button className="app-link" onClick={logout}>
          LOG OUT
        </button>
        <button className="app-link" onClick={getUserInfo}>
          Log user info
        </button>
      </div>
    );
  };

  return loaded ? user ? renderAuthenticated() : renderUnauthenticated() : <h1>Loading....</h1>;
}

export default App;
