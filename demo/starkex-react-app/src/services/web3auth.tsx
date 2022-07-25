import { ADAPTER_EVENTS, SafeEventEmitterProvider } from "@web3auth/base";
import { Web3Auth } from "@web3auth/web3auth";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { createContext, FunctionComponent, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../config/chainConfig";
import { WEB3AUTH_NETWORK_TYPE } from "../config/web3AuthNetwork";
import { getWalletProvider, IWalletProvider } from "./walletProvider";
import { ec as elliptic } from "elliptic";
import { grindKey, ec as starkEc } from "@toruslabs/starkware-crypto";
import StarkExAPI from "@starkware-industries/starkex-js/dist/browser";
import BN from "bn.js";

export interface IWeb3AuthContext {
  web3Auth: Web3Auth | null;
  provider: IWalletProvider | null;
  isLoading: boolean;
  user: unknown;
  chain: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  getStarkHDAccount: () => Promise<void>;
  onMintRequest: () => Promise<void>;
  onDepositRequest: () => Promise<void>;
  onWithdrawalRequest: () => Promise<void>;
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
  getStarkHDAccount: async () => {},
  onMintRequest: async () => {},
  onDepositRequest: async () => {},
  onWithdrawalRequest: async () => {},
});

export function useWeb3Auth(): IWeb3AuthContext {
  return useContext(Web3AuthContext);
}

interface IWeb3AuthState {
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
}
interface IWeb3AuthProps {
  children?: ReactNode;
  web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
  chain: CHAIN_CONFIG_TYPE;
}

const starkExAPI = new StarkExAPI({
  endpoint: "https://gw.playground-v2.starkex.co",
});

export const Web3AuthProvider: FunctionComponent<IWeb3AuthState> = ({ children, web3AuthNetwork, chain }: IWeb3AuthProps) => {
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IWalletProvider | null>(null);
  const [user, setUser] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setWalletProvider = useCallback(
    (web3authProvider: SafeEventEmitterProvider) => {
      const walletProvider = getWalletProvider(chain, web3authProvider, uiConsole);
      setProvider(walletProvider);
    },
    [chain]
  );

  useEffect(() => {
    const subscribeAuthEvents = (web3auth: Web3Auth) => {
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
        const clientId = "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA";
        const web3AuthInstance = new Web3Auth({
          chainConfig: currentChainConfig,
          // get your client id from https://dashboard.web3auth.io
          clientId,
        });
        const adapter = new OpenloginAdapter({ adapterSettings: { network: web3AuthNetwork, clientId } });
        web3AuthInstance.configureAdapter(adapter);
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
  }, [chain, web3AuthNetwork, setWalletProvider]);

  const login = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    const localProvider = await web3Auth.connect();
    setWalletProvider(localProvider!);
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

  const getStarkHDAccount = async () => {
    const account = await getStarkAccount();
    if (account) {
      uiConsole({
        privKey: account.getPrivate("hex"),
        pubKey: account.getPublic("hex"),
      });
    }
  };

  const getStarkAccount = async (): Promise<elliptic.KeyPair | undefined> => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      uiConsole("web3auth not initialized yet");
      return;
    }
    const starkEcOrder = starkEc.n;
    const provider = web3Auth.provider;
    if (!provider) {
      console.log("provider is null");
      uiConsole("provider is null");
      return;
    }
    const privKey = await provider.request({ method: "eth_private_key" });
    const account = starkEc.keyFromPrivate(grindKey(privKey as string, starkEcOrder as BN), "hex");
    return account;
  };

  const getStarkKey = async (): Promise<string | undefined> => {
    const account = await getStarkAccount();
    return account?.getPrivate("hex");
  };

  const onMintRequest = async () => {
    const txId = await starkExAPI.gateway.getFirstUnusedTxId();
    const starkKey = await getStarkKey();

    const request = {
      txId,
      vaultId: 1654615998,
      amount: "6",
      tokenId: "0x400de4b5a92118719c78df48f4ff31e78de58575487ce1eaf19922ad9b8a714",
      starkKey: `0x${starkKey}`,
    };
    console.log("---request", request);
    const response = await starkExAPI.gateway.mint(request);
    uiConsole({ response });
  };

  const onDepositRequest = async () => {
    const txId = await starkExAPI.gateway.getFirstUnusedTxId();
    const starkKey = await getStarkKey();
    const request = {
      txId,
      amount: 8,
      starkKey: `0x${starkKey}`,
      tokenId: "0x3ef811e040c4bc9f9eee715441cee470f5d5aff69b9cd9aca7884f5a442a890",
      vaultId: 1924014660,
    };
    const response = await starkExAPI.gateway.deposit(request);
    uiConsole({ response });
  };

  const onWithdrawalRequest = async () => {
    const txId = await starkExAPI.gateway.getFirstUnusedTxId();
    const starkKey = await getStarkKey();
    const request = {
      txId,
      amount: 8,
      starkKey: `0x${starkKey}`,
      tokenId: "0x2dd48fd7a024204f7c1bd874da5e709d4713d60c8a70639eb1167b367a9c378",
      vaultId: 612008755,
    };
    const response = await starkExAPI.gateway.withdrawal(request);
    uiConsole({ response });
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
    login,
    logout,
    getUserInfo,
    getStarkHDAccount,
    onMintRequest,
    onDepositRequest,
    onWithdrawalRequest,
  };
  return <Web3AuthContext.Provider value={contextProvider}>{children}</Web3AuthContext.Provider>;
};
