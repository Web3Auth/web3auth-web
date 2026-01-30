import { ChainNamespaceType, ConnectorInitialAuthenticationModeType, WalletRegistry } from "@web3auth/no-modal";
import React, { createContext, useContext } from "react";

import { browser, os, platform, UIConfig } from "../interfaces";

type WidgetContextType = {
  appLogo?: string;
  appName: string;
  chainNamespaces: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
  deviceDetails: { platform: platform; browser: browser; os: os };
  uiConfig: UIConfig;
  initialAuthenticationMode: ConnectorInitialAuthenticationModeType;
};

type WidgetProviderProps = {
  children: React.ReactNode;
  appLogo?: string;
  appName: string;
  chainNamespaces: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
  deviceDetails: { platform: platform; browser: browser; os: os };
  uiConfig: UIConfig;
  initialAuthenticationMode: ConnectorInitialAuthenticationModeType;
};

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const WidgetProvider: React.FC<WidgetProviderProps> = ({
  children,
  appLogo,
  appName,
  chainNamespaces,
  walletRegistry,
  deviceDetails,
  uiConfig,
  initialAuthenticationMode,
}) => {
  return (
    <WidgetContext.Provider value={{ appLogo, appName, chainNamespaces, walletRegistry, deviceDetails, uiConfig, initialAuthenticationMode }}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
