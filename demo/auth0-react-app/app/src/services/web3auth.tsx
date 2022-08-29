import { ADAPTER_EVENTS, SafeEventEmitterProvider, WALLET_ADAPTER_TYPE } from "@web3auth/base";
import { Web3AuthCore } from "@web3auth/core";
import type { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { createContext, FunctionComponent, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import { WEB3AUTH_NETWORK_TYPE } from "../config/web3AuthNetwork";
import { getWalletProvider, IWalletProvider } from "./walletProvider";
import { APP_CONFIG_TYPE } from "../config/appConfig";

export interface IWeb3AuthContext {
  web3Auth: Web3AuthCore | null;
  provider: IWalletProvider | null;
  isLoading: boolean;
  user: unknown;
  chain: string;
  isWeb3AuthInit: boolean;
  loginRWA: (adapter: WALLET_ADAPTER_TYPE, provider: LOGIN_PROVIDER_TYPE, jwtToken: string) => Promise<void>;
  login: (adapter: WALLET_ADAPTER_TYPE, provider: LOGIN_PROVIDER_TYPE) => Promise<void>;
  logout: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
  getUserInfo: () => Promise<any>;
  signMessage: () => Promise<any>;
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
  signTransaction: () => Promise<void>;
  signAndSendTransaction: () => Promise<void>;
}

export const Web3AuthContext = createContext<IWeb3AuthContext>({
  web3Auth: null,
  provider: null,
  isLoading: false,
  user: null,
  chain: "",
  isWeb3AuthInit: false,
  setIsLoading: (loading: boolean) => {},
  loginRWA: async (adapter: WALLET_ADAPTER_TYPE, provider: LOGIN_PROVIDER_TYPE, jwtToken: string) => {},
  login: async (adapter: WALLET_ADAPTER_TYPE, provider: LOGIN_PROVIDER_TYPE) => {},
  logout: async () => {},
  getUserInfo: async () => {},
  signMessage: async () => {},
  getAccounts: async () => {},
  getBalance: async () => {},
  signTransaction: async () => {},
  signAndSendTransaction: async () => {},
});

export function useWeb3Auth(): IWeb3AuthContext {
  return useContext(Web3AuthContext);
}

interface IWeb3AuthState {
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
  app: APP_CONFIG_TYPE;
  children?: React.ReactNode
}
interface IWeb3AuthProps {
  children?: ReactNode;
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
  app: APP_CONFIG_TYPE;
}

export const Web3AuthProvider: FunctionComponent<IWeb3AuthState> = ({ children, web3AuthNetwork, chain, app }: IWeb3AuthProps) => {
  const [web3Auth, setWeb3Auth] = useState<Web3AuthCore | null>(null);
  const [provider, setProvider] = useState<IWalletProvider | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWeb3AuthInit, setweb3authinit] = useState(false);
  const setWalletProvider = useCallback(
    (web3authProvider: SafeEventEmitterProvider) => {
      const walletProvider = getWalletProvider(chain, web3authProvider, uiConsole);
      setTimeout(
        function () {
          setProvider(walletProvider);
        },
        1000
      );
    },
    [chain]
  );

  useEffect(() => {
    const subscribeAuthEvents = (web3auth: Web3AuthCore) => {
      // Can subscribe to all ADAPTER_EVENTS and LOGIN_MODAL_EVENTS
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data: unknown) => {
        console.log("Yeah!, you are successfully logged in", data);
        setUser(data);
        setWalletProvider(web3auth.provider!);
      });

      web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        setUser(null);
      });

      web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
        console.error("some error or user has cancelled login request", error);
      });
    };

    const currentChainConfig = CHAIN_CONFIG[chain];

    async function init() {
      try {
        setIsLoading(true);
        // get your client id from https://dashboard.web3auth.io by registering a plug and play application.
        const clientId = process.env.REACT_APP_CLIENT_ID || "BMuAPXdFXaK94pUgfNluIEBPMTiwWKQz0h8AkCtf4Rzxv4bNLwsTRXSlt5OlB6KSpP_jYFhzloMf2XhUYADB3JE";
        // const clientId = process.env.REACT_APP_CLIENT_ID ||  "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA";

        const web3AuthInstance = new Web3AuthCore({
          chainConfig: currentChainConfig,
          clientId,
        });
        subscribeAuthEvents(web3AuthInstance);
        if (sessionStorage.getItem("app") === null) {
          sessionStorage.setItem("app", "SPA");
        }
        if (sessionStorage.getItem("app") === "SPA") {
          const adapter = new OpenloginAdapter({
            adapterSettings: {
              network: web3AuthNetwork,
              clientId,
              uxMode: "redirect",
              loginConfig: {
                jwt: {
                  name: "Custom Auth0 Login",
                  verifier: "twitter-auth0-verifier",
                  typeOfLogin: "jwt",
                  clientId: process.env.REACT_APP_SPA_CLIENTID,
                },
              },
            },
          });
          web3AuthInstance.configureAdapter(adapter);
          await web3AuthInstance.init();
          setWeb3Auth(web3AuthInstance);
        } else {
          // alert(sessionStorage.getItem('app'))
          const adapter = new OpenloginAdapter({
            adapterSettings: {
              network: web3AuthNetwork,
              clientId,
              uxMode: "redirect",
              loginConfig: {
                jwt: {
                  name: "rwa Auth0 Login",
                  verifier: "auth0-rwa-web3auth",
                  typeOfLogin: "jwt",
                  clientId: process.env.REACT_APP_RWA_CLIENTID,
                },
              },
            },
          });
          web3AuthInstance.configureAdapter(adapter);
          await web3AuthInstance.init();
          setWeb3Auth(web3AuthInstance);
          setweb3authinit(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [chain, web3AuthNetwork, setWalletProvider]);

  const login = async (adapter: WALLET_ADAPTER_TYPE, loginProvider: LOGIN_PROVIDER_TYPE) => {
    try {
      setIsLoading(true);
      if (!web3Auth) {
        console.log("web3auth not initialized yet");
        uiConsole("web3auth not initialized yet");
        return;
      }
      const localProvider = await web3Auth.connectTo(adapter, {
        relogin: true,
        loginProvider,
        extraLoginOptions: {
          domain: process.env.REACT_APP_AUTH0_DOMAIN,
          verifierIdField: "sub",
        },
      });
      setWalletProvider(localProvider!);
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  };
  const loginRWA = async (adapter: WALLET_ADAPTER_TYPE, loginProvider: LOGIN_PROVIDER_TYPE, jwt_token: string) => {
    try {
      setIsLoading(true);
      if (!web3Auth) {
        console.log("web3auth not initialized yet");
        uiConsole("web3auth not initialized yet");
        return;
      }
      const localProvider = await web3Auth.connectTo(adapter, {
        loginProvider,
        extraLoginOptions: {
          id_token: jwt_token,
          domain: process.env.REACT_APP_AUTH0_DOMAIN,
          verifierIdField: "sub",
        },
      });
      setWalletProvider(localProvider!);
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3Auth.logout();
    if (sessionStorage.getItem("app") === "RWA") {
      window.open(process.env.REACT_APP_AUTH0_DOMAIN + "/v2/logout?federated");
    }
    setProvider(null);
    window.sessionStorage.clear();
    window.location.href = "/";
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

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.getAccounts();
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.getBalance();
  };

  const signMessage = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.signMessage();
  };

  const signTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.signTransaction();
  };

  const signAndSendTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await provider.signAndSendTransaction();
  };

  const uiConsole = (...args: unknown[]): void => {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  };

  const contextProvider = {
    web3Auth,
    chain,
    provider,
    user,
    isLoading,
    isWeb3AuthInit,
    setIsLoading,
    loginRWA,
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    signTransaction,
    signAndSendTransaction,
  };
  return <Web3AuthContext.Provider value={contextProvider}>{children}</Web3AuthContext.Provider>;
};
