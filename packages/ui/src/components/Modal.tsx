import { LOGIN_PROVIDER, OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
import type { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { ADAPTER_NAMES, log } from "@web3auth/base";
import cloneDeep from "lodash.clonedeep";
import deepmerge from "lodash.merge";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ThemedContext } from "../context/ThemeContext";
import { ExternalWalletEventType, MODAL_STATUS, ModalState, SocialLoginEventType } from "../interfaces";
import AdapterLoader from "./AdapterLoader";
import ExternalWallets from "./ExternalWallets";
import Footer from "./Footer";
import Header from "./Header";
// import Loader from "./Loader";
import SocialLoginPasswordless from "./SocialLoginPasswordless";
import SocialLogins from "./SocialLogins";

interface ModalProps {
  stateListener: SafeEventEmitter;
  appLogo?: string;
  appName?: string;
  web3AuthNetwork: OPENLOGIN_NETWORK_TYPE;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
}

log.enableAll();

// const DETAILED_ADAPTERS = [WALLET_ADAPTERS.PHANTOM, WALLET_ADAPTERS.METAMASK];

export default function Modal(props: ModalProps) {
  const [modalTransitionClasses, setModalTransitionClasses] = useState(["w3a-modal__inner"]);

  const [modalState, setModalState] = useState<ModalState>({
    externalWalletsVisibility: false,
    status: MODAL_STATUS.INITIALIZED,
    hasExternalWallets: false,
    externalWalletsInitialized: false,
    modalVisibility: false,
    modalVisibilityDelayed: false,
    postLoadingMessage: "",
    walletConnectUri: "",
    socialLoginsConfig: {
      loginMethods: {},
      loginMethodsOrder: [],
      adapter: "",
      uiConfig: {},
    },
    externalWalletsConfig: {},
    detailedLoaderAdapter: "",
    detailedLoaderAdapterName: "",
    showExternalWalletsOnly: false,
    wcAdapters: [],
  });
  const { isDark } = useContext(ThemedContext);
  const [t] = useTranslation();

  const {
    stateListener,
    appLogo,
    appName,
    handleSocialLoginClick,
    handleExternalWalletClick,
    handleShowExternalWallets,
    closeModal,
    web3AuthNetwork,
  } = props;

  useEffect(() => {
    stateListener.emit("MOUNTED");
    stateListener.on("STATE_UPDATED", (newModalState: Partial<ModalState>) => {
      log.debug("state updated", newModalState);

      setModalState((prevState) => {
        const mergedState = cloneDeep(deepmerge(prevState, newModalState));
        return mergedState;
      });
    });
  }, [stateListener]);

  useEffect(() => {
    let timeOutId: number;
    if (modalState.modalVisibility) {
      setModalState((prevState) => {
        return { ...prevState, modalVisibilityDelayed: modalState.modalVisibility };
      });

      timeOutId = window.setTimeout(() => {
        setModalTransitionClasses(["w3a-modal__inner", modalState.modalVisibility ? "w3a-modal__inner--active" : ""]);
        // hide external wallets, if modal is closing, so that it will show social login screen on reopen.
      }, 100);
    } else {
      setModalTransitionClasses(["w3a-modal__inner", modalState.modalVisibility ? "w3a-modal__inner--active" : ""]);
      // hide external wallets, if modal is closing, so that it will show social login screen on reopen.

      timeOutId = window.setTimeout(() => {
        setModalState((prevState) => {
          return { ...prevState, modalVisibilityDelayed: modalState.modalVisibility };
        });
      }, 250);
    }
    return () => {
      clearTimeout(timeOutId);
    };
  }, [modalState.modalVisibility]);

  const onCloseLoader = useCallback(() => {
    if (modalState.status === MODAL_STATUS.CONNECTED) {
      closeModal();
    }
    if (modalState.status === MODAL_STATUS.ERRORED) {
      setModalState((prevState) => {
        return { ...prevState, modalVisibility: true, status: MODAL_STATUS.INITIALIZED };
      });
    }
  }, [closeModal, modalState.status]);

  const preHandleExternalWalletClick = useCallback(
    (params: ExternalWalletEventType) => {
      const { adapter } = params;
      // if (DETAILED_ADAPTERS.includes(adapter))
      setModalState((prevState) => {
        return { ...prevState, detailedLoaderAdapter: adapter, detailedLoaderAdapterName: ADAPTER_NAMES[adapter] };
      });
      // else if (adapter !== WALLET_ADAPTERS.WALLET_CONNECT_V1)
      //   setModalState((prevState) => {
      //     return { ...prevState, detailedLoaderAdapter: "" };
      //   });
      handleExternalWalletClick(params);
    },
    [handleExternalWalletClick]
  );

  const preHandleSocialWalletClick = (params: SocialLoginEventType) => {
    const { loginParams } = params;
    setModalState((prevState) => {
      return { ...prevState, detailedLoaderAdapter: loginParams.loginProvider, detailedLoaderAdapterName: loginParams.name };
    });
    handleSocialLoginClick(params);
  };

  const isEmailPrimary = modalState.socialLoginsConfig?.uiConfig?.primaryButton === "emailLogin";
  const isExternalPrimary = modalState.socialLoginsConfig?.uiConfig?.primaryButton === "externalLogin";

  const externalWalletButton = (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-toggle w3ajs-external-toggle">
        <div className="w3a-group__title">{t("modal.external.title")}</div>
        <button
          type="button"
          className={`w3a-button ${isExternalPrimary ? "w3a-button--primary" : ""} w-full w3ajs-external-toggle__button`}
          onClick={() => {
            handleShowExternalWallets(modalState.externalWalletsInitialized);
            setModalState((prevState) => {
              return {
                ...prevState,
                externalWalletsVisibility: true,
              };
            });
          }}
        >
          {t("modal.external.connect")}
        </button>
      </div>
    </div>
  );

  const areSocialLoginsVisible = useMemo(() => {
    if (modalState.showExternalWalletsOnly) return false;
    if (Object.keys(modalState.socialLoginsConfig?.loginMethods || {}).length === 0) return false;
    const isAnySocialLoginVisible = Object.entries(modalState.socialLoginsConfig?.loginMethods || {}).some(
      ([k, v]) => k !== LOGIN_PROVIDER.EMAIL_PASSWORDLESS && v.showOnModal !== false
    );
    if (isAnySocialLoginVisible) return true;
    return false;
  }, [modalState.showExternalWalletsOnly, modalState.socialLoginsConfig?.loginMethods]);
  log.info("modal state", modalState, areSocialLoginsVisible);

  const isEmailPasswordlessLoginVisible = useMemo(() => {
    return modalState.socialLoginsConfig?.loginMethods[LOGIN_PROVIDER.EMAIL_PASSWORDLESS]?.showOnModal;
  }, [modalState.socialLoginsConfig?.loginMethods]);

  const isSmsPasswordlessLoginVisible = useMemo(() => {
    return modalState.socialLoginsConfig?.loginMethods[LOGIN_PROVIDER.SMS_PASSWORDLESS]?.showOnModal;
  }, [modalState.socialLoginsConfig?.loginMethods]);

  // const modalClassName = `w3a-modal ${isDark ? "" : " w3a-modal--light"}`;
  const modalClassName = `w3a-modal ${isDark ? "" : ""}`;

  return (
    modalState.modalVisibilityDelayed && (
      <div id="w3a-modal" className={modalClassName}>
        <div className={modalTransitionClasses.join(" ")}>
          <Header onClose={closeModal} appLogo={appLogo} appName={appName} />
          {modalState.status !== MODAL_STATUS.INITIALIZED ? (
            <div className="w3a-modal__content w3ajs-content">
              {/* {modalState.detailedLoaderAdapter ? ( */}
              <AdapterLoader
                onClose={onCloseLoader}
                appLogo={appLogo}
                modalStatus={modalState.status}
                message={modalState.postLoadingMessage}
                adapter={modalState.detailedLoaderAdapter}
                adapterName={modalState.detailedLoaderAdapterName}
              />
              {/* ) : ( */}
              {/* <Loader onClose={onCloseLoader} modalStatus={modalState.status} message={modalState.postLoadingMessage} /> */}
              {/* )} */}
            </div>
          ) : (
            <div className="w3a-modal__content w3ajs-content">
              {(areSocialLoginsVisible || isEmailPasswordlessLoginVisible || isSmsPasswordlessLoginVisible) &&
              !modalState.externalWalletsVisibility ? (
                <>
                  {areSocialLoginsVisible ? (
                    <SocialLogins
                      handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
                      socialLoginsConfig={modalState.socialLoginsConfig}
                    />
                  ) : null}

                  {(isEmailPasswordlessLoginVisible || isSmsPasswordlessLoginVisible) && (
                    <SocialLoginPasswordless
                      isEmailVisible={isEmailPasswordlessLoginVisible}
                      isSmsVisible={isSmsPasswordlessLoginVisible}
                      adapter={modalState.socialLoginsConfig?.adapter}
                      web3AuthNetwork={web3AuthNetwork}
                      handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
                      isPrimaryBtn={isEmailPrimary}
                    />
                  )}

                  {/* button to show external wallets */}
                  {modalState.hasExternalWallets && externalWalletButton}
                </>
              ) : (
                <ExternalWallets
                  modalStatus={modalState.status}
                  showBackButton={areSocialLoginsVisible}
                  handleExternalWalletClick={preHandleExternalWalletClick}
                  walletConnectUri={modalState.walletConnectUri}
                  wcAdapters={modalState.wcAdapters}
                  config={modalState.externalWalletsConfig}
                  hideExternalWallets={() =>
                    setModalState((prevState) => {
                      return { ...prevState, externalWalletsVisibility: false };
                    })
                  }
                />
              )}
            </div>
          )}

          <Footer />
        </div>
      </div>
    )
  );
}
