import { CONNECTOR_EVENTS, IProvider, PLUGIN_EVENTS, WalletServicesPluginType, Web3Auth, WEB3AUTH_NETWORK_TYPE, SMART_ACCOUNT, walletServicesPlugin, EVM_PLUGINS } from "@web3auth/modal";
import { createContext, FunctionComponent, ReactNode, useContext, useEffect, useState } from "react";
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import * as ethHandler from "./ethHandler";

export interface IWeb3AuthContext {
  web3Auth: Web3Auth | null;
  provider: IProvider | null;
  isLoading: boolean;
  isReady: boolean;
  user: unknown;
  chain: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  signMessage: () => Promise<any>;
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
  signTransaction: () => Promise<void>;
  switchChain: () => Promise<void>;
  showWalletConnectScanner: () => Promise<void>;
  showWalletUi: () => Promise<void>;
  enableMFA: () => Promise<void>;
  manageMFA: () => Promise<void>;
}

export const Web3AuthContext = createContext<IWeb3AuthContext>({
  web3Auth: null,
  provider: null,
  isLoading: false,
  user: null,
  chain: "",
  isReady: false,
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => {},
  signMessage: async () => {},
  getAccounts: async () => {},
  getBalance: async () => {},
  signTransaction: async () => {},
  switchChain: async () => {},
  showWalletConnectScanner: async () => {},
  showWalletUi: async () => {},
  enableMFA: async () => {},
  manageMFA: async () => {},
});

export function useWeb3Auth(): IWeb3AuthContext {
  return useContext(Web3AuthContext);
}

interface IWeb3AuthState {
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
  children?: React.ReactNode;
}
interface IWeb3AuthProps {
  children?: ReactNode;
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
}
const pimlicoAPIKey = import.meta.env.VITE_PIMLICO_API_KEY;

export const Web3AuthProvider: FunctionComponent<IWeb3AuthState> = ({ children, web3AuthNetwork, chain }: IWeb3AuthProps) => {
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [waasProvider, setWaasProvider] = useState<IProvider | null>(null);
  const [wsPlugin, setWsPlugin] = useState<WalletServicesPluginType | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const subscribeAuthEvents = (web3auth: Web3Auth) => {
      // Can subscribe to all CONNECTOR_EVENTS and LOGIN_MODAL_EVENTS
      web3auth.on(CONNECTOR_EVENTS.CONNECTED, (data: unknown) => {
        console.log("Yeah!, you are successfully logged in", data);
        setUser(data);
        setProvider(web3auth.provider);
      });

      web3auth.on(CONNECTOR_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(CONNECTOR_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        setUser(null);
      });

      web3auth.on(CONNECTOR_EVENTS.ERRORED, (error) => {
        console.error("some error or user has cancelled login request", error);
      });

      web3auth.on(CONNECTOR_EVENTS.READY, () => {
        console.log("web3auth is ready");
        setIsReady(true);
      });
    };

    const subscribePluginEvents = (plugin: WalletServicesPluginType) => {
      // Can subscribe to all PLUGIN_EVENTS and LOGIN_MODAL_EVENTS
      plugin.on(PLUGIN_EVENTS.CONNECTED, (data: unknown) => {
        console.log("Yeah!, you are successfully logged in to plugin");
        setWaasProvider(plugin.wsEmbedInstance?.provider as IProvider);
      });

      plugin.on(PLUGIN_EVENTS.CONNECTING, () => {
        console.log("connecting plugin");
      });

      plugin.on(PLUGIN_EVENTS.DISCONNECTED, () => {
        console.log("plugin disconnected");
      });

      plugin.on(PLUGIN_EVENTS.ERRORED, (error) => {
        console.error("some error on plugin login", error);
      });
    };

    async function init() {
      try {
        const currentChainConfig = CHAIN_CONFIG[chain];
        setIsLoading(true);
        const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";

        const web3AuthInstance = new Web3Auth({
          // get your client id from https://dashboard.web3auth.io
          clientId,
          web3AuthNetwork,
          chains: [currentChainConfig],
          uiConfig: {
            appName: "W3A Heroes",
            appUrl: "https://web3auth.io/",
            theme: {
              primary: "#5f27cd",
              onPrimary: "white",
            },
            defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl, tr
            mode: "auto", // whether to enable dark mode. defaultValue: auto
            // useLogoLoader: true,
            loginGridCol: 3,
            primaryButton: "socialLogin",
          },
          enableLogging: true,
          authBuildEnv: "testing"
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
    setProvider(localProvider!);
  };

  const logout = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3Auth.logout();
    setProvider(null);
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

  const enableMFA = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3Auth.enableMFA();
  };

  const manageMFA = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3Auth.manageMFA();
  };

  const switchChain = async () => {
    const chainId = "0x89";
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    await web3Auth?.switchChain({ chainId });
    uiConsole("Chain Switched");
  };

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await ethHandler.getAccounts(provider, uiConsole);
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await ethHandler.getBalance(provider, uiConsole);
  };

  const signMessage = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await ethHandler.signEthMessage(provider, uiConsole);
    // await waasProvider?.signMessage();
  };

  const signTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      uiConsole("provider not initialized yet");
      return;
    }
    await ethHandler.signTransaction(provider, uiConsole);
  };

  const showWalletConnectScanner = async () => {
    if (!wsPlugin) {
      console.log("walletServicesPlugin not initialized yet");
      uiConsole("walletServicesPlugin not initialized yet");
      return;
    }
    if (web3Auth != null && web3Auth.status !== "connected") {
      console.log("web3Auth not initialized yet");
      uiConsole("web3Auth not initialized yet");
      return;
    }
    await wsPlugin.showWalletConnectScanner();
  };

  const showWalletUi = async () => {
    if (!wsPlugin) {
      console.log("walletServicesPlugin not initialized yet");
      uiConsole("walletServicesPlugin not initialized yet");
      return;
    }
    if (web3Auth != null && web3Auth.status !== "connected") {
      console.log("web3Auth not initialized yet");
      uiConsole("web3Auth not initialized yet");
      return;
    }
    await wsPlugin.showWalletUi();
  };

  const uiConsole = (...args: unknown[]): void => {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
    }
  };

  const contextProvider = {
    web3Auth,
    chain,
    provider,
    user,
    isLoading,
    isReady,
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    signTransaction,
    switchChain,
    showWalletConnectScanner,
    enableMFA,
    manageMFA,
    showWalletUi,
  };
  return <Web3AuthContext.Provider value={contextProvider}>{children}</Web3AuthContext.Provider>;
};
