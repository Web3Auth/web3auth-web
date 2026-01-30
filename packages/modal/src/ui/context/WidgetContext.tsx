import { ChainNamespaceType, ConnectorInitialAuthenticationModeType, WALLET_CONNECTOR_TYPE, WalletRegistry } from "@web3auth/no-modal";
import React, { createContext, useContext, useMemo } from "react";

import { browser, ExternalWalletEventType, LoginModalProps, os, platform, SocialLoginEventType } from "../interfaces";

type WidgetContextType = {
  appLogo?: string;
  appName: string;
  chainNamespaces: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
  deviceDetails: { platform: platform; browser: browser; os: os };
  uiConfig: LoginModalProps;
  initialAuthenticationMode: ConnectorInitialAuthenticationModeType;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
};

type WidgetProviderProps = {
  children: React.ReactNode;
  appLogo?: string;
  appName: string;
  chainNamespaces: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
  deviceDetails: { platform: platform; browser: browser; os: os };
  uiConfig: LoginModalProps;
  initialAuthenticationMode: ConnectorInitialAuthenticationModeType;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
};

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const WidgetProvider: React.FC<WidgetProviderProps> = ({
  children,
  appLogo,
  appName,
  chainNamespaces,
  walletRegistry,
  deviceDetails,
  uiConfig: uiConfigProps,
  initialAuthenticationMode,
  handleSocialLoginClick,
  handleExternalWalletClick,
  handleMobileVerifyConnect,
  handleShowExternalWallets,
  closeModal,
}) => {
  const uiConfig = useMemo<LoginModalProps>(() => {
    return {
      buttonRadiusType: "pill",
      ...uiConfigProps,
    };
  }, [uiConfigProps]);

  return (
    <WidgetContext.Provider
      value={{
        appLogo,
        appName,
        chainNamespaces,
        walletRegistry,
        deviceDetails,
        uiConfig,
        initialAuthenticationMode,
        handleSocialLoginClick,
        handleExternalWalletClick,
        handleMobileVerifyConnect,
        handleShowExternalWallets,
        closeModal,
      }}
    >
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
