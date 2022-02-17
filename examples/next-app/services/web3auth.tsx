import { ADAPTER_EVENTS, SafeEventEmitterProvider } from "@web3auth/base";
import type { Web3Auth } from "@web3auth/web3auth";
import { createContext, FunctionComponent, ReactNode, useContext, useEffect, useState } from "react";
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import { WEB3AUTH_NETWORK_TYPE } from "../config/web3AuthNetwork";
import Web3 from "web3";
export interface IWeb3AuthContext {
  web3Auth: Web3Auth | null;
  provider: SafeEventEmitterProvider | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  user: unknown;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  signEthMessage: () => Promise<any>;
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
}

export const Web3AuthContext = createContext<IWeb3AuthContext>({
  web3Auth: null,
  provider: null,
  isLoading: false,
  user: null,
  isLoggedIn: false,
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => {},
  signEthMessage: async () => {},
  getAccounts: async () => {},
  getBalance: async () => {},
});

export function useWeb3Auth() {
  return useContext(Web3AuthContext);
}

export const Web3AuthProvider: FunctionComponent<{ web3AuthNetwork: WEB3AUTH_NETWORK_TYPE; chain: CHAIN_CONFIG_TYPE }> = ({
  children,
  web3AuthNetwork,
  chain,
}: {
  children?: ReactNode;
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
}) => {
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const subscribeAuthEvents = (web3auth: Web3Auth) => {
      // Can subscribe to all ADAPTER_EVENTS and LOGIN_MODAL_EVENTS
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data: unknown) => {
        console.log("Yeah!, you are successfully logged in", data);
        setLoggedIn(true);
      });

      web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        setLoggedIn(false);
      });

      web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
        console.error("some error or user has cancelled login request", error);
      });
    };

    const currentChainConfig = CHAIN_CONFIG[chain];
    async function init() {
      try {
        const { Web3Auth } = await import("@web3auth/web3auth");
        setIsLoading(true);
        const web3AuthInstance = new Web3Auth({
          chainConfig: currentChainConfig,
          // get your client id from https://dashboard.web3auth.io
          clientId: "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA",
        });
        subscribeAuthEvents(web3AuthInstance);
        setWeb3Auth(web3AuthInstance);
        await web3AuthInstance.initModal();
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [chain, web3AuthNetwork]);

  const login = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    const localProvider = await web3Auth.connect();
    setProvider(localProvider);
  };

  const logout = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3Auth.logout();
  };

  const getUserInfo = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3Auth.getUserInfo();
    uiConsole(user);
  };

  const uiConsole = (...args: unknown[]): void => {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  };

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    } 
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      uiConsole("accounts", accounts);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    } 
    try {
      const web3 = new Web3(provider as any);
      const accounts = await web3.eth.getAccounts();
      const balance = await web3.eth.getBalance(accounts[0]);
      uiConsole("balance", balance);
    } catch (error) {
      console.error("Error", error);
      uiConsole("error", error);
    }
  };

  const signEthMessage = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    } 
    try {
      const pubKey = await provider.request({ method: "eth_accounts" }) as string[];
      const web3 = new Web3(provider as any);
      const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
      (web3.currentProvider as any)?.send(
        {
          method: "eth_sign",
          params: [pubKey[0], message],
          from: pubKey[0],
        },
        (err: Error, result: any) => {
          if (err) {
            return uiConsole(err);
          }
          uiConsole("sign message => true", result);
        }
      );
    } catch (error) {
      console.log("error", error);
      uiConsole("error", error);
    }
  };

  const contextProvider = {
    web3Auth,
    provider,
    user,
    isLoading,
    isLoggedIn,
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signEthMessage,
  };
  return <Web3AuthContext.Provider value={contextProvider}>{children}</Web3AuthContext.Provider>;
};
