/* eslint-disable no-console */
import type { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import deepmerge from "deepmerge";
import React, { useCallback, useContext, useEffect, useState } from "react";

import { ThemedContext } from "../context/ThemeContext";
import { ExternalWalletEventType, MODAL_STATUS, ModalState, SocialLoginEventType } from "../interfaces";
import ExternalWallets from "./ExternalWallets";
import Footer from "./Footer";
import Header from "./Header";
import Loader from "./Loader";
import SocialLoginEmail from "./SocialLoginEmail";
import SocialLogins from "./SocialLogins";

interface ModalProps {
  stateListener: SafeEventEmitter;
  appLogo?: string;
  version: string;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
}

export default function Modal(props: ModalProps) {
  const [externalWalletsVisible, setExternalWalletsVisibility] = useState(false);
  const { isDark } = useContext(ThemedContext);
  const [modalTransitionClasses, setModalTransitionClasses] = useState(["w3a-modal__inner"]);
  const [showModal, setShowModal] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    externalWalletsVisibility: false,
    status: MODAL_STATUS.INITIALIZED,
    hasExternalWallets: false,
    externalWalletsInitialized: false,
    modalVisibility: false,
    postLoadingMessage: "",
    walletConnectUri: "",
    socialLoginsConfig: {
      loginMethods: {},
      loginMethodsOrder: [],
      adapter: "",
    },
    externalWalletsConfig: {},
  });

  const { stateListener, appLogo, version, handleSocialLoginClick, handleExternalWalletClick, handleShowExternalWallets, closeModal } = props;

  useEffect(() => {
    console.log("mounted");
    stateListener.emit("MOUNTED");
    stateListener.on("STATE_UPDATED", (newModalState: ModalState) => {
      console.log("incoming state", newModalState);
      setModalState((prevState) => deepmerge(prevState, newModalState));
    });
  }, []);

  console.log("modal state", modalState);

  useEffect(() => {
    setTimeout(() => {
      setModalTransitionClasses(["w3a-modal__inner", modalState.modalVisibility ? "w3a-modal__inner--active" : ""]);
      setShowModal(modalState.modalVisibility);
    }, 100);
  }, [modalState.modalVisibility]);

  useEffect(() => {
    console.log("externalWalletsVisibility", modalState.externalWalletsVisibility);
    setExternalWalletsVisibility(modalState.externalWalletsVisibility);
  }, [modalState.externalWalletsVisibility]);

  const onCloseLoader = useCallback(() => {
    if (modalState.status === MODAL_STATUS.CONNECTED) {
      setShowModal(false);
      closeModal();
    }
    if (modalState.status === MODAL_STATUS.ERRORED) {
      setModalState({ ...modalState, modalVisibility: true, status: MODAL_STATUS.INITIALIZED });
    }
  }, [modalState.status]);

  const externalWalletButton = (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-toggle w3ajs-external-toggle">
        <h6 className="w3a-group__title">EXTERNAL WALLET</h6>
        <button
          type="button"
          className="w3a-button w3ajs-external-toggle__button"
          onClick={() => {
            handleShowExternalWallets(modalState.externalWalletsInitialized);
            setExternalWalletsVisibility(true);
          }}
        >
          Connect with Wallet
        </button>
      </div>
    </div>
  );

  const modalClassName = `w3a-modal ${isDark ? "" : " w3a-modal--light"}`;
  return (
    <div id="w3a-modal" className={modalClassName} style={{ display: !showModal ? "none" : "flex" }}>
      <div className={modalTransitionClasses.join(" ")}>
        <Header onClose={() => setShowModal(false)} appLogo={appLogo} />
        {modalState.status !== MODAL_STATUS.INITIALIZED ? (
          <div className="w3a-modal__content w3ajs-content">
            <Loader onClose={onCloseLoader} modalStatus={modalState.status} message={modalState.postLoadingMessage} />
          </div>
        ) : (
          <div className="w3a-modal__content w3ajs-content">
            {!externalWalletsVisible && Object.keys(modalState.socialLoginsConfig?.loginMethods).length > 0 ? (
              <>
                {Object.keys(modalState.socialLoginsConfig?.loginMethods).length > 0 && (
                  <>
                    <SocialLogins handleSocialLoginClick={handleSocialLoginClick} socialLoginsConfig={modalState.socialLoginsConfig} />
                    <SocialLoginEmail adapter={modalState.socialLoginsConfig?.adapter} handleSocialLoginClick={handleSocialLoginClick} />
                  </>
                )}
                {/* button to show external wallets */}
                {modalState.hasExternalWallets && <>{externalWalletButton}</>}
              </>
            ) : (
              <>
                <ExternalWallets
                  modalStatus={modalState.status}
                  showBackButton={Object.keys(modalState.socialLoginsConfig?.loginMethods).length > 0}
                  handleExternalWalletClick={handleExternalWalletClick}
                  walletConnectUri={modalState.walletConnectUri}
                  config={modalState.externalWalletsConfig}
                  showWalletConnect
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
