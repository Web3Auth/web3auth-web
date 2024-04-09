import { ADAPTER_EVENTS, CustomChainConfig, type IProvider, WALLET_ADAPTERS } from "@web3auth/base";
import { type ModalConfig } from "@web3auth/modal";
import { type LoginParams, type OpenloginAdapter, type OpenloginUserInfo } from "@web3auth/openlogin-adapter";
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

  async function addAndSwitchChain(chainConfig: CustomChainConfig) {
    if (!web3auth) throw new Error(WAIT_FOR_INIT_MSG);
    await web3auth.addChain(chainConfig);

    await web3auth.switchChain({ chainId: chainConfig.chainId });
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
    addAndSwitchChain,
    addChain: web3auth?.addChain.bind(web3auth),
    addPlugin: web3auth?.addPlugin.bind(web3auth),
    authenticateUser: web3auth?.authenticateUser.bind(web3auth),
    switchChain: web3auth?.switchChain.bind(web3auth),
  };
};
