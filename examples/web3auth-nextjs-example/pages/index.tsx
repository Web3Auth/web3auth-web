
import type { Web3Auth } from '@web3auth/web3auth'
import { ADAPTER_EVENTS, CHAIN_NAMESPACES } from '@web3auth/base'

import type { NextPage } from 'next'

import { useState, useEffect } from 'react'

const Home: NextPage = () => {
  const [user, setUser] = useState(null);
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
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
    };

    const polygonMumbaiConfig = {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0x1",
    };

   

    // ⭐️ initialize modal on page mount.
    const initializeModal = async () => {
      const { Web3Auth } = (await import("@web3auth/web3auth"));
      const web3auth = new Web3Auth({
        chainConfig: polygonMumbaiConfig,
        clientId: "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA",
      });
      setWeb3auth(web3auth);
      console.log("initializeModal");
      subscribeAuthEvents(web3auth);
      await web3auth.initModal();
      setLoaded(true);
    };

    initializeModal();
  }, []);

  const login = async () => {
    try {
      if (!web3auth) return;
      const provider = await web3auth.connect();
      // TODO: add this provider to web3/ethers
     } catch (error) {
       console.log("error in login", error);
     }
  };
  const logout = async () => {
    if (!web3auth) return;
    await web3auth.logout();
  };
  const getUserInfo = async () => {
    if (!web3auth) return;
    const userInfo = await web3auth.getUserInfo();
    console.log(userInfo);
  };

  const renderUnauthenticated = () => {
    return (
      <div className="main">
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

  return loaded ? (user ? renderAuthenticated() : renderUnauthenticated()): <h1>Loading....</h1>;
}

export default Home
