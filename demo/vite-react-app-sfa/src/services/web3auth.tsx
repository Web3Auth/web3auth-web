import { CONNECTOR_EVENTS, IProvider, Web3AuthNoModal, WEB3AUTH_NETWORK_TYPE, authConnector } from "@web3auth/no-modal";
import { createContext, FunctionComponent, ReactNode, useContext, useEffect, useState } from "react";
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import * as ethHandler from "./ethHandler";

export interface IWeb3AuthContext {
  web3Auth: Web3AuthNoModal | null;
  provider: IProvider | null;
  isLoading: boolean;
  user: unknown;
  chain: string;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  signMessage: () => Promise<any>;
  getAccounts: () => Promise<any>;
  getBalance: () => Promise<any>;
  signTransaction: () => Promise<void>;
  switchChain: () => Promise<void>;
  enableMFA: () => Promise<void>;
  manageMFA: () => Promise<void>;
}

export const Web3AuthContext = createContext<IWeb3AuthContext>({
  web3Auth: null,
  provider: null,
  isLoading: false,
  user: null,
  chain: "",
  logout: async () => {},
  getUserInfo: async () => {},
  signMessage: async () => {},
  getAccounts: async () => {},
  getBalance: async () => {},
  signTransaction: async () => {},
  switchChain: async () => {},
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

export const Web3AuthProvider: FunctionComponent<IWeb3AuthState> = ({ children, web3AuthNetwork, chain }: IWeb3AuthProps) => {
  const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const subscribeAuthEvents = (web3auth: Web3AuthNoModal) => {
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
    };

    async function init() {
      try {
        const currentChainConfig = CHAIN_CONFIG[chain];
        setIsLoading(true);
        const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";
        const authConnectorInstance = authConnector({
          connectorSettings: { buildEnv: "development" },
        });

        const web3AuthInstance = new Web3AuthNoModal({
          // get your client id from https://dashboard.web3auth.io
          clientId,
          web3AuthNetwork,
          chains: [currentChainConfig],
          enableLogging: true,
          connectors: [authConnectorInstance],
        });

        subscribeAuthEvents(web3AuthInstance);
        setWeb3Auth(web3AuthInstance);

        await web3AuthInstance.init();
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [chain, web3AuthNetwork]);

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
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
    signMessage,
    signTransaction,
    switchChain,
    enableMFA,
    manageMFA,
  };
  return <Web3AuthContext.Provider value={contextProvider}>{children}</Web3AuthContext.Provider>;
};
