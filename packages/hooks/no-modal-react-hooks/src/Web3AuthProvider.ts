import type { IAdapter, IPlugin, Web3AuthNoModalOptions } from "@web3auth/base";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { createContext, createElement, PropsWithChildren, useEffect, useState } from "react";

export type Web3AuthContextConfig = {
  web3AuthNoModalOptions: Web3AuthNoModalOptions;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export const Web3AuthContext = createContext<Web3AuthNoModal | null>(null);

interface Web3AuthProviderProps {
  config: Web3AuthContextConfig;
}

export function Web3AuthProvider(params: PropsWithChildren<Web3AuthProviderProps>) {
  const { children, config } = params;
  const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal | null>(null);

  useEffect(() => {
    const { web3AuthNoModalOptions, adapters = [], plugins = [] } = config;
    const web3Instance = new Web3AuthNoModal(web3AuthNoModalOptions);
    if (adapters.length) adapters.map((adapter) => web3Instance.configureAdapter(adapter));
    if (plugins.length) plugins.map((plugin) => web3Instance.addPlugin(plugin));
    setWeb3Auth(web3Instance);
  }, [config]);

  const props = { value: web3Auth };
  return createElement(Web3AuthContext.Provider, props, children);
}
