import { WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";
import { createContext, type FC, type ReactNode, useContext, useMemo } from "react";

import { browser, ExternalWalletEventType, LoginModalProps, os, platform, SocialLoginEventType } from "../interfaces";

type WidgetContextType = {
  isDark: boolean;
  appLogo?: string;
  deviceDetails: { platform: platform; browser: browser; os: os };
  uiConfig: LoginModalProps;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
};

type WidgetProviderProps = {
  children: ReactNode;
  isDark: boolean;
  deviceDetails: { platform: platform; browser: browser; os: os };
  uiConfig: LoginModalProps;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
};

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const WidgetProvider: FC<WidgetProviderProps> = ({
  children,
  isDark = true,
  deviceDetails,
  uiConfig,
  handleSocialLoginClick,
  handleExternalWalletClick,
  handleMobileVerifyConnect,
  handleShowExternalWallets,
  closeModal,
}) => {
  const appLogo = useMemo(() => {
    return isDark ? uiConfig.logoDark : uiConfig.logoLight;
  }, [isDark, uiConfig.logoDark, uiConfig.logoLight]);

  return (
    <WidgetContext.Provider
      value={{
        isDark,
        appLogo,
        deviceDetails,
        uiConfig,
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
