/* eslint-disable no-console */
import { BaseAdapterConfig } from "@web3auth/base";
import React, { useCallback, useContext, useEffect, useState } from "react";

import { MODAL_STATUS } from "..";
import { ThemedContext } from "../context/ThemeContext";
import { ModalState, SocialLoginsConfig } from "../interfaces";
import ExternalWallets from "./ExternalWallets";
import Footer from "./Footer";
import Header from "./Header";
import Loader from "./Loader";
import SocialLoginEmail from "./SocialLoginEmail";
import SocialLogins from "./SocialLogins";

interface ModalProps {
  modalState: ModalState;
  appLogo?: string;
  version: string;
  hasExternalWallets: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  externalWallets: Record<string, BaseAdapterConfig>;
  walletConnectUri?: string;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string } }) => void;
  handleExternalWalletClick: (params: { adapter: string }) => void;
  handleShowExternalWallets: () => void;
  closeModal: () => void;
  reinitializeModal: () => void;
}

export default function Modal(props: ModalProps) {
  const [externalWalletsVisible, setExternalWalletsVisibility] = useState(false);
  const { isDark } = useContext(ThemedContext);

  const {
    appLogo,
    modalState,
    version,
    socialLoginsConfig,
    externalWallets,
    walletConnectUri,
    hasExternalWallets,
    handleSocialLoginClick,
    handleExternalWalletClick,
    handleShowExternalWallets,
    reinitializeModal,
    closeModal,
  } = props;

  useEffect(() => {
    console.log("modal rendered", props);
  }, []);

  useEffect(() => {
    console.log("externalWalletsVisibility", modalState.externalWalletsVisibility);
    setExternalWalletsVisibility(modalState.externalWalletsVisibility);
  }, [modalState.externalWalletsVisibility]);

  const onCloseLoader = useCallback(() => {
    if (modalState.status === MODAL_STATUS.CONNECTED) {
      closeModal();
    }
    if (modalState.status === MODAL_STATUS.ERRORED) {
      reinitializeModal();
    }
  }, [modalState.status]);

  const externalWalletButton = () => {
    return (
      <div className="w3ajs-external-wallet w3a-group">
        <div className="w3a-external-toggle w3ajs-external-toggle">
          <h6 className="w3a-group__title">EXTERNAL WALLET</h6>
          <button
            className="w3a-button w3ajs-external-toggle__button"
            onClick={() => {
              handleShowExternalWallets();
              setExternalWalletsVisibility(true);
            }}
          >
            Connect with Wallet
          </button>
        </div>
      </div>
    );
  };

  const modalClassName = `w3a-modal ${isDark ? "" : " w3a-modal--light"}`;
  return (
    <div id="w3a-modal" className={modalClassName}>
      <div className="w3a-modal__inner w3a-modal__inner--active">
        <Header onClose={() => props.closeModal()} appLogo={appLogo} />
        {modalState.status !== MODAL_STATUS.INITIALIZED ? (
          <Loader onClose={onCloseLoader} modalStatus={modalState.status} message={modalState.postLoadingMessage} />
        ) : (
          <div className="w3a-modal__content w3ajs-content">
            {!externalWalletsVisible && Object.keys(socialLoginsConfig.loginMethods).length > 0 ? (
              <>
                {Object.keys(socialLoginsConfig.loginMethods).length > 0 && (
                  <>
                    <SocialLogins handleSocialLoginClick={handleSocialLoginClick} socialLoginsConfig={socialLoginsConfig} />
                    <SocialLoginEmail adapter={socialLoginsConfig.adapter} handleSocialLoginClick={handleSocialLoginClick} />
                  </>
                )}
                {/* button to show external wallets */}
                {hasExternalWallets && <>{externalWalletButton()}</>}
              </>
            ) : (
              <>
                <ExternalWallets
                  modalStatus={modalState.status}
                  postLoadingMessage={modalState.postLoadingMessage}
                  showBackButton={Object.keys(socialLoginsConfig.loginMethods).length > 0}
                  handleExternalWalletClick={handleExternalWalletClick}
                  walletConnectUri={walletConnectUri}
                  config={externalWallets}
                  showWalletConnect={true}
                  hideExternalWallets={() => setExternalWalletsVisibility(false)}
                />
              </>
            )}
          </div>
        )}

        <Footer version={version} />
      </div>
    </div>
  );
}
