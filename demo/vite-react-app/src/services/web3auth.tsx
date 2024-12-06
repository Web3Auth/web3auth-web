import { ADAPTER_EVENTS, CHAIN_NAMESPACES, CustomChainConfig, IProvider, WEB3AUTH_NETWORK_TYPE } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { createContext, FunctionComponent, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import * as ethHandler from "./ethHandler";
import { PLUGIN_EVENTS } from "@web3auth/base";
import * as walletServiceHandler from "./walletServiceHandlers";
import { AccountAbstractionProvider, SafeSmartAccount } from "@web3auth/account-abstraction-provider";

export interface IWeb3AuthContext {
  web3Auth: Web3Auth | null;
  provider: IProvider | null;
  isLoading: boolean;
  user: unknown;
  chain: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  signMessage: () => Promise<any>;
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
  signTransaction: () => Promise<void>;
  addChain: () => Promise<void>;
  switchChain: () => Promise<void>;
  showWalletConnectScanner: () => Promise<void>;
  showWalletUi: () => Promise<void>;
  enableMFA: () => Promise<void>;
}

export const Web3AuthContext = createContext<IWeb3AuthContext>({
  web3Auth: null,
  provider: null,
  isLoading: false,
  user: null,
  chain: "",
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => {},
  signMessage: async () => {},
  getAccounts: async () => {},
  getBalance: async () => {},
  signTransaction: async () => {},
  addChain: async () => {},
  switchChain: async () => {},
  showWalletConnectScanner: async () => {},
  showWalletUi: async () => {},
  enableMFA: async () => {},
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
  const [walletServicesPlugin, setWalletServicesPlugin] = useState<WalletServicesPlugin | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const subscribeAuthEvents = (web3auth: Web3Auth) => {
      // Can subscribe to all ADAPTER_EVENTS and LOGIN_MODAL_EVENTS
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data: unknown) => {
        console.log("Yeah!, you are successfully logged in", data);
        setUser(data);
        setProvider(web3auth.provider);
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

    const subscribePluginEvents = (plugin: WalletServicesPlugin) => {
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
        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: currentChainConfig } });
        const accountAbstractionProvider = new AccountAbstractionProvider({
          config: {
            chainConfig: currentChainConfig,
            bundlerConfig: {
              url: `https://api.pimlico.io/v2/11155111/rpc?apikey=${pimlicoAPIKey}`,
            },
            smartAccountInit: new SafeSmartAccount(),
            paymasterConfig: {
              url: `https://api.pimlico.io/v2/11155111/rpc?apikey=${pimlicoAPIKey}`,
            },
          },
        });
        setIsLoading(true);
        const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";

        const web3AuthInstance = new Web3Auth({
          // get your client id from https://dashboard.web3auth.io
          clientId,
          web3AuthNetwork,
          privateKeyProvider,
          accountAbstractionProvider,
          chainConfig: currentChainConfig,
          uiConfig: {
            uxMode: "redirect",
            appName: "W3A Heroes",
            appUrl: "https://web3auth.io/",
            theme: {
              primary: "#5f27cd",
              onPrimary: "white",
            },
            logoLight: "https://web3auth.io/images/web3auth-logo.svg",
            logoDark: "https://web3auth.io/images/web3auth-logo.svg",
            defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl, tr
            mode: "auto", // whether to enable dark mode. defaultValue: auto
            // useLogoLoader: true,
            loginGridCol: 3,
            primaryButton: "socialLogin",
          },
          enableLogging: true,
        });

        // Wallet Services Plugin

        const walletServicesPlugin = new WalletServicesPlugin({
          wsEmbedOpts: {},
          walletInitOptions: {
            whiteLabel: { showWidgetButton: true },
            confirmationStrategy: "modal",
          },
        });

        subscribePluginEvents(walletServicesPlugin);
        setWalletServicesPlugin(walletServicesPlugin);
        web3AuthInstance.addPlugin(walletServicesPlugin);

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

  const addChain = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const newChain: CustomChainConfig = {
      rpcTarget: "https://rpc.ankr.com/polygon",
      blockExplorerUrl: "https://polygonscan.com/",
      chainId: "0x89",
      displayName: "Polygon Mainnet",
      ticker: "POL",
      tickerName: "Polygon Ecosystem Token",
      logo: "https://images.toruswallet.io/matic.svg",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
    };
    await web3Auth?.addChain(newChain);
    uiConsole("New Chain Added");
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
    if (!walletServicesPlugin) {
      console.log("walletServicesPlugin not initialized yet");
      uiConsole("walletServicesPlugin not initialized yet");
      return;
    }
    if (web3Auth != null && web3Auth.status !== "connected") {
      console.log("web3Auth not initialized yet");
      uiConsole("web3Auth not initialized yet");
      return;
    }
    await walletServicesPlugin.showWalletConnectScanner();
  };

  const showWalletUi = async () => {
    if (!walletServicesPlugin) {
      console.log("walletServicesPlugin not initialized yet");
      uiConsole("walletServicesPlugin not initialized yet");
      return;
    }
    if (web3Auth != null && web3Auth.status !== "connected") {
      console.log("web3Auth not initialized yet");
      uiConsole("web3Auth not initialized yet");
      return;
    }
    await walletServicesPlugin.showWalletUi();
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
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    signTransaction,
    addChain,
    switchChain,
    showWalletConnectScanner,
    enableMFA,
    showWalletUi,
  };
  return <Web3AuthContext.Provider value={contextProvider}>{children}</Web3AuthContext.Provider>;
};
