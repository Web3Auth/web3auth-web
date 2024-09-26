import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LOGIN_PROVIDER, LOGIN_PROVIDER_TYPE, WhiteLabelData } from "@web3auth/auth";
import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig, IAdapter, IBaseProvider, IPlugin, WALLET_ADAPTER_TYPE, WALLET_ADAPTERS, WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE } from "@web3auth/base";
import { useSessionStorage } from 'usehooks-ts'
import { Web3AuthContextConfig } from '@web3auth/modal-react-hooks';
import { type ModalConfig, type Web3Auth, type Web3AuthOptions } from "@web3auth/modal";
import { chainConfigs, clientIds, web3authInitialConfig } from '@/config';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { WalletServicesPlugin } from '@web3auth/wallet-services-plugin';
import { CoinbaseAdapter } from "@web3auth/coinbase-adapter";
import { getInjectedAdapters as getInjectedEvmAdapters } from "@web3auth/default-evm-adapter";
import { getInjectedAdapters as getInjectedSolanaAdapters } from "@web3auth/default-solana-adapter";
import { TorusWalletAdapter } from "@web3auth/torus-evm-adapter";
import { WalletConnectV2Adapter } from "@web3auth/wallet-connect-v2-adapter";
import { SolanaWalletAdapter } from "@web3auth/torus-solana-adapter";

interface AppConfigSettings {
  name: string;
  description: string;
  logoHover: string;
  logoLight: string;
  logoDark: string;
  mainOption: boolean;
  showOnModal: boolean;
  showOnDesktop: boolean;
  showOnMobile: boolean;
}

interface Option {
  label: string;
  value: string;
}

type AppContextType = {
  network: WEB3AUTH_NETWORK_TYPE;
  setNetWork: (network: WEB3AUTH_NETWORK_TYPE) => void;
  chainNamespace: ChainNamespaceType;
  setChainNamespace: (chainNamespace: ChainNamespaceType) => void;
  chain: string;
  setChain: (chain: string) => void;
  whiteLabel: {
    enable: boolean;
    config: WhiteLabelData;
  };
  setWhiteLabel: (whiteLabel: { enable: boolean; config: WhiteLabelData }) => void;
  loginProviders: LOGIN_PROVIDER_TYPE[];
  setLoginProviders: (loginProviders: LOGIN_PROVIDER_TYPE[]) => void;
  adapters: string[];
  setAdapters: (adapters: string[]) => void;
  loginMethods: Record<LOGIN_PROVIDER_TYPE, AppConfigSettings>;
  setLoginMethods: (loginMethods: Record<LOGIN_PROVIDER_TYPE, AppConfigSettings>) => void;
  walletPlugin: {
    enable: boolean;
    logoDark: string;
    logoLight: string;
  };
  setWalletPlugin: (walletPlugin: { enable: boolean; logoDark: string; logoLight: string }) => void;
  chainOptions: Option[];
  adapterOptions: Option[];
  web3authContextConfig: Web3AuthContextConfig;
};

const initWhiteLabel: WhiteLabelData = {
  appName: "HelloDemo",
  appUrl: "http://localhost:8080",
  logoDark: "https://images.web3auth.io/example-hello.svg", // dark logo for light background
  logoLight: "https://images.web3auth.io/example-hello-light.svg", // light logo for dark background
  mode: "auto",
  defaultLanguage: "en",
  theme: {
    primary: "#5DF0EB",
    onPrimary: "black",
  },
};
const loginProviderOptions = Object.values(LOGIN_PROVIDER)
  .filter((x) => x !== "jwt" && x !== "webauthn")
  .map((x) => ({ name: x.replaceAll("_", " "), value: x }));

const defaultLoginMethod: Record<LOGIN_PROVIDER_TYPE, AppConfigSettings> = loginProviderOptions.reduce(
  (acc, curr) => ({
    ...acc,
    [curr.value]: {
      name: `${curr.name} login`,
      description: "",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: false,
      showOnDesktop: false,
      showOnMobile: false,
    },
  }),
  {} as Record<LOGIN_PROVIDER_TYPE, AppConfigSettings>
);

const AppContext = createContext<AppContextType>({
  network: WEB3AUTH_NETWORK.TESTNET,
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chain: CHAIN_NAMESPACES.EIP155,
  whiteLabel: {
    enable: false,
    config: initWhiteLabel,
  },
  loginProviders: [],
  adapters: [],
  loginMethods: defaultLoginMethod,
  walletPlugin: {
    enable: false,
    logoLight: "",
    logoDark: "",
  },
  setNetWork: () => {},
  setChainNamespace: () => {},
  setChain: () => {},
  setWhiteLabel: () => {},
  setLoginProviders: () => {},
  setAdapters: () => {},
  setLoginMethods: () => {},
  setWalletPlugin: () => {},

  web3authContextConfig: web3authInitialConfig,
  chainOptions: [],
  adapterOptions: [],
});

export const AppProvider: React.FC<{ children: React.ReactNode}> = ({ children }) => {

  const [network, setNetWork] = useState<WEB3AUTH_NETWORK_TYPE>(WEB3AUTH_NETWORK.TESTNET);
  const [chainNamespace, setChainNamespace] = useState<ChainNamespaceType>(CHAIN_NAMESPACES.EIP155);
  const [chain, setChain] = useState<string>("0x1");
  const [whiteLabel, setWhiteLabel] = useState<{ enable: boolean; config: WhiteLabelData }>({
    enable: false,
    config: initWhiteLabel,
  });
  const [loginProviders, setLoginProviders] = useState<LOGIN_PROVIDER_TYPE[]>([]);
  const [adapters, setAdapters] = useState<string[]>([]);
  const [loginMethods, setLoginMethods] = useState<Record<LOGIN_PROVIDER_TYPE, AppConfigSettings>>(defaultLoginMethod);
  const [walletPlugin, setWalletPlugin] = useState<{ enable: boolean; logoDark: string; logoLight: string }>({
    enable: false,
    logoDark: "",
    logoLight: "",
  });
  const chainOptions = useMemo<Option[]>(() => (chainConfigs[chainNamespace as ChainNamespaceType]|| []).map((x) => ({ label: `${x.chainId} ${x.tickerName}`, value: x.chainId })), [chainNamespace, chain]);

  const adapterOptions = useMemo<Option[]>(() => chainNamespace === CHAIN_NAMESPACES.EIP155 ?
    [
      { label: "coinbase-adapter", value: "coinbase" },
      { label: "torus-evm-adapter", value: "torus-evm" },
      { label: "wallet-connect-v2-adapter", value: "wallet-connect-v2" },
      { label: "injected-adapters", value: "injected-evm" },
    ] :
    [
      { label: "torus-solana-adapter", value: "torus-solana" },
      { label: "injected-adapters", value: "injected-solana" },
    ], [chainNamespace]);
  const [formData, setFormData, clearFormData] = useSessionStorage<AppContextType>('formData', {} as AppContextType);

  const getExternalAdapterByName = async (name: string): Promise<IAdapter<unknown>[]> => {
    switch (name) {
      case "coinbase":
        return [new CoinbaseAdapter() as IAdapter<unknown>];
      // case "auth":
      //   return new AuthAdapter();
      case "torus-evm":
        return [new TorusWalletAdapter()];
      case "torus-solana":
        return [new SolanaWalletAdapter() as IAdapter<unknown>];
      case "wallet-connect-v2":
        return [new WalletConnectV2Adapter({ adapterSettings: { walletConnectInitOptions: { projectId: "d3c63f19f9582f8ba48e982057eb096b" } } }) as IAdapter<unknown>];
      case "injected-evm":
        return getInjectedEvmAdapters({ options: web3authOptions });
      case "injected-solana":
        return getInjectedSolanaAdapters({ options: web3authOptions });
      default:
        return [];
    }
  };
  
  const [web3authAdapters, setWeb3authAdapters] = useState<IAdapter<unknown>[]>([]);

  useEffect(() => {
    const fetchAdapters = async () => {
      let newAdapters: IAdapter<unknown>[] = [];
      for (let i = 0; i < adapters.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        newAdapters = newAdapters.concat(await getExternalAdapterByName(adapters[i]));
      }
      setWeb3authAdapters(newAdapters);
    };

    fetchAdapters();
  }, [adapters]);
  
  const web3authPlugins = useMemo<IPlugin[]>(() => {
    if (chainNamespace !== CHAIN_NAMESPACES.EIP155 || !walletPlugin.enable) return [];
    const { logoDark, logoLight } = formData.walletPlugin;
    const walletServicesPlugin = new WalletServicesPlugin({
      walletInitOptions: { whiteLabel: { showWidgetButton: true, logoDark: logoDark || "logo", logoLight: logoLight || "logo" } },
    });
    return [walletServicesPlugin];
  }, [walletPlugin, chainNamespace]);

  const loginMethodsConfig = useMemo(() => {
    if (loginProviders?.length) return undefined;
  
    if (!Object.values(loginMethods || {}).some((x) => x.showOnModal)) {
      return undefined;
    }

    return loginMethods;
  }, [loginProviders, loginMethods]);

  const modalParams = useMemo(() => {
    const modalConfig = {
      [WALLET_ADAPTERS.AUTH]: {
        label: "auth",
        loginMethods: loginMethodsConfig,
      },
    };
    return modalConfig;
  },[loginMethodsConfig]);
  
  const chainConfig = useMemo<CustomChainConfig>(() => {
    if (!chainNamespace) return {} as CustomChainConfig;

    const chainConfigByNamespace = chainConfigs[chainNamespace as ChainNamespaceType] || [];
    
    if (!chainConfigByNamespace.length) return {} as CustomChainConfig

    return chainConfigByNamespace.find((x) => x.chainId === chain) || chainConfigByNamespace[0];

  }, [chainNamespace, chain]);

  const privateKeyProvider = useMemo<IBaseProvider<string>>(() => {
    if((chainOptions || chainOptions > 0) && !chainOptions.map(option => option.value).includes(chain)) setChain(chainOptions[0].value);
    switch (chainNamespace) {
      case CHAIN_NAMESPACES.EIP155:
        return new EthereumPrivateKeyProvider({
          config: {
            chainConfig,
          },
        });
      case CHAIN_NAMESPACES.SOLANA:
        return new SolanaPrivateKeyProvider({
          config: {
            chainConfig,
          },
        });
      default:
        return new CommonPrivateKeyProvider({
          config: {
            chainConfig,
          },
        });
    }
  }, [chainNamespace, chain]);

  const web3authOptions = useMemo<Web3AuthOptions>(() => {
    return {
      clientId: clientIds[network],
      privateKeyProvider,
      web3AuthNetwork: network,
      uiConfig: whiteLabel.enable ? { ...whiteLabel.config } : undefined,
      enableLogging: true,
    };
  }, [network, privateKeyProvider]);

  const web3authContextConfig = useMemo<Web3AuthContextConfig>(() => ({
    adapters: web3authAdapters,
    plugins: web3authPlugins,
    modalConfig: modalParams,
    web3AuthOptions: web3authOptions,
  }), [web3authAdapters, web3authPlugins, modalParams, web3authOptions]);


  useEffect(() => {
    setFormData(
      {
        ...formData,
        network,
        chainNamespace,
        chain,
        whiteLabel,
        loginProviders,
        adapters,
        loginMethods,
        walletPlugin,
      }
    )

    

  }, [network, chainNamespace, chain, whiteLabel, loginProviders, adapters, loginMethods, walletPlugin]);

  useEffect(() => {
    if(formData) {
      setNetWork(formData.network);
      setChainNamespace(formData.chainNamespace);
      setChain(formData.chain);
      setWhiteLabel(formData.whiteLabel);
      setLoginProviders(formData.loginProviders);
      setAdapters(formData.adapters);
      setLoginMethods(formData.loginMethods);
      setWalletPlugin(formData.walletPlugin);
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
      network, 
      setNetWork,
      chainNamespace,
      setChainNamespace,
      chain,
      setChain,
      whiteLabel,
      setWhiteLabel,
      loginProviders,
      setLoginProviders,
      adapters,
      setAdapters,
      loginMethods,
      setLoginMethods,
      walletPlugin,
      setWalletPlugin,

      web3authContextConfig,
      chainOptions,
      adapterOptions,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
};