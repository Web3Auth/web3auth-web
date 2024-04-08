import { ADAPTER_EVENTS, IProvider, WALLET_ADAPTERS } from "@web3auth/base";
import { ModalConfig } from "@web3auth/modal";
import { LoginParams, OpenloginAdapter, type OpenloginUserInfo } from "@web3auth/openlogin-adapter";
import { useContext, useEffect, useState } from "react";

import { Web3AuthContext } from "./Web3AuthProvider";

const WAIT_FOR_INIT_MSG = "Wait for web3auth to be ready first";

export const useWeb3Auth = () => {
  const web3auth = useContext(Web3AuthContext);

  const [isConnected, setConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [userInfo, setUserInfo] = useState<Partial<OpenloginUserInfo> | null>(null);
  const [isMFAEnabled, setIsMFAEnabled] = useState<boolean>(false);

  useEffect(() => {
    const addState = async () => {
      setProvider(web3auth.provider);
      const userState = await web3auth.getUserInfo();
      setUserInfo(userState);
      setIsMFAEnabled(userState?.isMfaEnabled || false);
    };

    const resetState = () => {
      setProvider(null);
      setUserInfo(null);
      setIsMFAEnabled(false);
    };

    if (web3auth) {
      if (isConnected) addState();
      else resetState();
    }
  }, [web3auth, isConnected]);

  const initModal = async (params: { modalConfig?: Record<string, ModalConfig> } = {}) => {
    if (!web3auth) throw new Error(WAIT_FOR_INIT_MSG);

    await web3auth.initModal(params);
  };

  useEffect(() => {
    if (web3auth) {
      web3auth.on(ADAPTER_EVENTS.CONNECTED, () => setConnected(true));
      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => setConnected(false));
    }
  }, [web3auth]);

  async function enableMFA(params: Partial<LoginParams> = {}) {
    if (!web3auth) throw new Error(WAIT_FOR_INIT_MSG);
    if (!isConnected) throw new Error("Connect to a wallet first");
    if (web3auth.connectedAdapterName !== WALLET_ADAPTERS.OPENLOGIN) throw new Error("Enable MFA is only supported for OpenLogin.");

    if (web3auth.connectedAdapterName === WALLET_ADAPTERS.OPENLOGIN) {
      await (web3auth.walletAdapters[WALLET_ADAPTERS.OPENLOGIN] as OpenloginAdapter).openloginInstance?.enableMFA(params);
      setIsMFAEnabled(userInfo?.isMfaEnabled || false);
    }
  }

  async function logout(params: { cleanup: boolean } = { cleanup: false }) {
    if (!web3auth) throw new Error(WAIT_FOR_INIT_MSG);
    if (!isConnected) throw new Error("Connect to a wallet first");

    await web3auth.logout(params);
  }

  async function connect(): Promise<IProvider | null> {
    if (!web3auth) throw new Error(WAIT_FOR_INIT_MSG);

    const localProvider = await web3auth.connect();
    return localProvider;
  }

  return {
    web3auth,
    isConnected,
    provider,
    userInfo,
    isMFAEnabled,
    initModal,
    connect,
    enableMFA,
    logout,
    addChain: web3auth?.addChain,
    addPlugin: web3auth?.addPlugin,
    authenticateUser: web3auth?.authenticateUser,
    switchChain: web3auth?.switchChain,
  };
};
