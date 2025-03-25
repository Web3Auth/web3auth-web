import { LOGIN_PROVIDER } from "@web3auth/auth";
import { cloneDeep, CONNECTOR_NAMES, log, WALLET_CONNECTORS } from "@web3auth/no-modal";
import deepmerge from "deepmerge";
import { useEffect, useMemo, useState } from "react";

import { PAGES } from "../../constants";
import { ExternalWalletEventType, MODAL_STATUS, ModalState, SocialLoginEventType, WIDGET_TYPE } from "../../interfaces";
import Embed from "../Embed";
import Modal from "../Modal";
import Root from "../Root";
import { WidgetProps } from "./Widget.type";

function Widget(props: WidgetProps) {
  const {
    stateListener,
    handleSocialLoginClick,
    handleExternalWalletClick,
    handleShowExternalWallets,
    closeModal,
    widget,
    appLogo,
    appName,
    chainNamespaces,
    walletRegistry,
  } = props;

  const visible = useMemo(() => widget === WIDGET_TYPE.EMBED, [widget]);

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
      connector: "",
      uiConfig: {},
    },
    externalWalletsConfig: {},
    showExternalWalletsOnly: false,
    currentPage: PAGES.LOGIN,
    detailedLoaderConnector: "",
    detailedLoaderConnectorName: "",
  });

  useEffect(() => {
    setModalState((prev) => ({ ...prev, modalVisibility: visible }));
  }, [visible]);

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

  const preHandleExternalWalletClick = (params: ExternalWalletEventType) => {
    const { connector } = params;
    setModalState((prevState) => ({
      ...prevState,
      detailedLoaderConnector: connector,
      detailedLoaderAdapterName: CONNECTOR_NAMES[connector],
    }));

    // Call the passed-in handler with the params
    if (handleExternalWalletClick) handleExternalWalletClick(params);
  };

  const preHandleSocialWalletClick = (params: SocialLoginEventType) => {
    const { loginParams } = params;
    setModalState((prevState) => {
      return { ...prevState, detailedLoaderConnector: loginParams.loginProvider, detailedLoaderConnectorName: loginParams.name };
    });
    handleSocialLoginClick(params);
  };

  // Memo for checking if social logins are visible
  const areSocialLoginsVisible = useMemo(() => {
    if (modalState.showExternalWalletsOnly) return false;
    if (Object.keys(modalState.socialLoginsConfig?.loginMethods || {}).length === 0) return false;

    const isAnySocialLoginVisible = Object.entries(modalState.socialLoginsConfig?.loginMethods || {}).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ([k, v]) => k !== LOGIN_PROVIDER.EMAIL_PASSWORDLESS && (v as any).showOnModal !== false
    );
    return isAnySocialLoginVisible;
  }, [modalState]);

  // Memo for checking if email passwordless login is visible
  const isEmailPasswordLessLoginVisible = useMemo(() => {
    return modalState.socialLoginsConfig?.loginMethods[LOGIN_PROVIDER.EMAIL_PASSWORDLESS]?.showOnModal;
  }, [modalState]);

  // Memo for checking if SMS passwordless login is visible
  const isSmsPasswordLessLoginVisible = useMemo(() => {
    return modalState.socialLoginsConfig?.loginMethods[LOGIN_PROVIDER.SMS_PASSWORDLESS]?.showOnModal;
  }, [modalState]);

  const isEmailPrimary = useMemo(() => modalState.socialLoginsConfig?.uiConfig?.primaryButton === "emailLogin", [modalState]);
  const isExternalPrimary = useMemo(() => modalState.socialLoginsConfig?.uiConfig?.primaryButton === "externalLogin", [modalState]);
  const showPasswordLessInput = useMemo(
    () => isEmailPasswordLessLoginVisible || isSmsPasswordLessLoginVisible,
    [isEmailPasswordLessLoginVisible, isSmsPasswordLessLoginVisible]
  );
  const showExternalWalletButton = useMemo(() => modalState.hasExternalWallets, [modalState]);
  const showExternalWalletPage = useMemo(
    () => (areSocialLoginsVisible || showPasswordLessInput) && !modalState.externalWalletsVisibility,
    [areSocialLoginsVisible, showPasswordLessInput, modalState]
  );

  const handleExternalWalletBtnClick = (flag: boolean) => {
    setModalState((prevState) => {
      return {
        ...prevState,
        externalWalletsVisibility: flag,
      };
    });
    if (handleShowExternalWallets) handleShowExternalWallets(modalState.externalWalletsInitialized);
  };

  const onCloseModal = () => {
    setModalState((prevState) => ({
      ...prevState,
      externalWalletsVisibility: false,
      modalVisibility: false,
      currentPage: PAGES.LOGIN,
    }));
    closeModal();
  };

  const onCloseLoader = () => {
    if (modalState.status === MODAL_STATUS.CONNECTED) {
      setModalState({
        ...modalState,
        modalVisibility: false,
        externalWalletsVisibility: false,
      });
    }
    if (modalState.status === MODAL_STATUS.ERRORED) {
      setModalState({
        ...modalState,
        modalVisibility: true,
        status: MODAL_STATUS.INITIALIZED,
      });
    }
  };

  const showCloseIcon = useMemo(() => {
    return (
      modalState.status === MODAL_STATUS.INITIALIZED || modalState.status === MODAL_STATUS.CONNECTED || modalState.status === MODAL_STATUS.ERRORED
    );
  }, [modalState]);

  // const handleBackClick = () => {
  //   setModalState({
  //     ...modalState,
  //     currentPage: PAGES.LOGIN,
  //   });
  //   log.debug("handleBackClick Body");
  // };

  useEffect(() => {
    if (typeof modalState.externalWalletsConfig === "object") {
      const wcAvailable = (modalState.externalWalletsConfig[WALLET_CONNECTORS.WALLET_CONNECT_V2]?.showOnModal || false) !== false;
      if (wcAvailable && !modalState.walletConnectUri && typeof handleExternalWalletClick === "function") {
        handleExternalWalletClick({ connector: WALLET_CONNECTORS.WALLET_CONNECT_V2 });
      }
    }
  }, [modalState, handleExternalWalletClick]);

  if (widget === WIDGET_TYPE.MODAL) {
    return (
      <Modal open={modalState.modalVisibility} placement="center" padding={false} showCloseIcon={showCloseIcon} onClose={onCloseModal}>
        <Root
          stateListener={stateListener}
          appLogo={appLogo}
          appName={appName}
          chainNamespace={chainNamespaces}
          walletRegistry={walletRegistry}
          showPasswordLessInput={showPasswordLessInput}
          showExternalWalletButton={showExternalWalletButton}
          handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
          socialLoginsConfig={modalState.socialLoginsConfig}
          areSocialLoginsVisible={areSocialLoginsVisible}
          isEmailPrimary={isEmailPrimary}
          isExternalPrimary={isExternalPrimary}
          showExternalWalletPage={showExternalWalletPage}
          handleExternalWalletBtnClick={handleExternalWalletBtnClick}
          modalState={modalState}
          preHandleExternalWalletClick={preHandleExternalWalletClick}
          setModalState={setModalState}
          onCloseLoader={onCloseLoader}
          isEmailPasswordLessLoginVisible={isEmailPasswordLessLoginVisible}
          isSmsPasswordLessLoginVisible={isSmsPasswordLessLoginVisible}
        />
      </Modal>
    );
  }

  return (
    <Embed open={modalState.modalVisibility} padding={false} onClose={onCloseModal}>
      <Root
        stateListener={stateListener}
        chainNamespace={chainNamespaces}
        walletRegistry={walletRegistry}
        appLogo={appLogo}
        appName={appName}
        showPasswordLessInput={showPasswordLessInput}
        showExternalWalletButton={showExternalWalletButton}
        handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
        socialLoginsConfig={modalState.socialLoginsConfig}
        areSocialLoginsVisible={areSocialLoginsVisible}
        isEmailPrimary={isEmailPrimary}
        isExternalPrimary={isExternalPrimary}
        showExternalWalletPage={showExternalWalletPage}
        handleExternalWalletBtnClick={handleExternalWalletBtnClick}
        modalState={modalState}
        preHandleExternalWalletClick={preHandleExternalWalletClick}
        setModalState={setModalState}
        onCloseLoader={onCloseLoader}
        isEmailPasswordLessLoginVisible={isEmailPasswordLessLoginVisible}
        isSmsPasswordLessLoginVisible={isSmsPasswordLessLoginVisible}
      />
    </Embed>
  );
}

export default Widget;
