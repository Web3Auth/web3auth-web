import type { IAdapter } from "@web3auth/base";
import type { IPlugin } from "@web3auth/base-plugin";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { createContext, createElement, PropsWithChildren, useEffect, useState } from "react";

export type Web3AuthContextConfig = {
  web3AuthOptions: Web3AuthOptions;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export const Web3AuthContext = createContext<Web3Auth | null>(null);

interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export function Web3AuthProvider(params: PropsWithChildren<Web3AuthProviderProps>) {
  const { children, config } = params;
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);

  useEffect(() => {
    const { web3AuthOptions, adapters = [], plugins = [] } = config;
    const web3Instance = new Web3Auth(web3AuthOptions);
    if (adapters.length) adapters.map((adapter) => web3Instance.configureAdapter(adapter));
    if (plugins.length) plugins.map((plugin) => web3Instance.addPlugin(plugin));
    setWeb3Auth(web3Instance);
  }, []);

  const props = { value: web3Auth };
  return createElement(Web3AuthContext.Provider, props, children);
}
