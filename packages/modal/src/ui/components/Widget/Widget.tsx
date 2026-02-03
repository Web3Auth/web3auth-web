import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import { CONNECTOR_INITIAL_AUTHENTICATION_MODE, CONNECTOR_NAMES, WALLET_CONNECTOR_TYPE, WALLET_CONNECTORS, WIDGET_TYPE } from "@web3auth/no-modal";
import { useEffect, useMemo } from "react";

import { PAGES } from "../../constants";
import { ModalStateProvider, useModalState } from "../../context/ModalStateContext";
import { useWidget } from "../../context/WidgetContext";
import { type ExternalWalletEventType, MODAL_STATUS, type SocialLoginEventType } from "../../interfaces";
import Embed from "../Embed";
import Modal from "../Modal";
import Root from "../Root";
import { WidgetProps } from "./Widget.type";

function WidgetContent() {
  const {
    uiConfig,
    initialAuthenticationMode,
    handleSocialLoginClick,
    handleExternalWalletClick,
    handleMobileVerifyConnect,
    handleShowExternalWallets,
    closeModal,
  } = useWidget();

  const { modalState, setModalState } = useModalState();

  const { widgetType } = uiConfig;

  const isConnectAndSignAuthenticationMode = useMemo(
    () => initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
    [initialAuthenticationMode]
  );

  const preHandleExternalWalletClick = (params: ExternalWalletEventType) => {
    const { connector } = params;
    setModalState((prevState) => ({
      ...prevState,
      detailedLoaderConnector: connector,
      detailedLoaderConnectorName: CONNECTOR_NAMES[connector as WALLET_CONNECTOR_TYPE],
    }));

    // Call the passed-in handler with the params
    if (handleExternalWalletClick) handleExternalWalletClick(params);
  };

  const preHandleSocialWalletClick = (params: SocialLoginEventType) => {
    const { loginParams } = params;
    setModalState((prevState) => {
      return { ...prevState, detailedLoaderConnector: loginParams.authConnection, detailedLoaderConnectorName: loginParams.name };
    });
    handleSocialLoginClick(params);
  };

  // Memo for checking if social logins are visible
  const areSocialLoginsVisible = useMemo(() => {
    if (modalState.showExternalWalletsOnly) return false;
    if (Object.keys(modalState.socialLoginsConfig?.loginMethods || {}).length === 0) return false;

    const isAnySocialLoginVisible = Object.entries(modalState.socialLoginsConfig?.loginMethods || {}).some(
      ([k, v]) =>
        !([AUTH_CONNECTION.EMAIL_PASSWORDLESS, AUTH_CONNECTION.SMS_PASSWORDLESS] as AUTH_CONNECTION_TYPE[]).includes(k as AUTH_CONNECTION_TYPE) &&
        v.showOnModal !== false
    );
    return isAnySocialLoginVisible;
  }, [modalState]);

  // Memo for checking if email passwordless login is visible
  const isEmailPasswordLessLoginVisible = useMemo(() => {
    return modalState.socialLoginsConfig?.loginMethods[AUTH_CONNECTION.EMAIL_PASSWORDLESS]?.showOnModal;
  }, [modalState.socialLoginsConfig]);

  // Memo for checking if SMS passwordless login is visible
  const isSmsPasswordLessLoginVisible = useMemo(() => {
    return modalState.socialLoginsConfig?.loginMethods[AUTH_CONNECTION.SMS_PASSWORDLESS]?.showOnModal;
  }, [modalState.socialLoginsConfig]);

  const isEmailPrimary = useMemo(() => modalState.socialLoginsConfig?.uiConfig?.primaryButton === "emailLogin", [modalState.socialLoginsConfig]);
  const isExternalPrimary = useMemo(
    () => modalState.socialLoginsConfig?.uiConfig?.primaryButton === "externalLogin",
    [modalState.socialLoginsConfig]
  );
  const showPasswordLessInput = useMemo(
    () => isEmailPasswordLessLoginVisible || isSmsPasswordLessLoginVisible,
    [isEmailPasswordLessLoginVisible, isSmsPasswordLessLoginVisible]
  );
  const showExternalWalletButton = useMemo(
    () => modalState.hasExternalWallets || !!modalState.externalWalletsConfig[WALLET_CONNECTORS.METAMASK],
    [modalState]
  );
  const showExternalWalletPage = useMemo(
    () =>
      (areSocialLoginsVisible || showPasswordLessInput || !!modalState.externalWalletsConfig[WALLET_CONNECTORS.METAMASK]) &&
      !modalState.externalWalletsVisibility,
    [areSocialLoginsVisible, showPasswordLessInput, modalState]
  );

  const handleExternalWalletBtnClick = (flag: boolean) => {
    setModalState((prevState) => {
      return {
        ...prevState,
        externalWalletsVisibility: flag,
      };
    });
    if (flag && handleShowExternalWallets) handleShowExternalWallets(modalState.externalWalletsInitialized);
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
    if (!isConnectAndSignAuthenticationMode && modalState.status === MODAL_STATUS.CONNECTED) {
      setModalState({
        ...modalState,
        modalVisibility: false,
        externalWalletsVisibility: false,
      });
    }
    if (isConnectAndSignAuthenticationMode && modalState.status === MODAL_STATUS.AUTHORIZED) {
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
      modalState.status === MODAL_STATUS.INITIALIZED ||
      modalState.status === MODAL_STATUS.CONNECTED ||
      modalState.status === MODAL_STATUS.ERRORED ||
      modalState.status === MODAL_STATUS.AUTHORIZED
    );
  }, [modalState.status]);

  useEffect(() => {
    // TODO: maybe move this inside root
    if (!modalState.modalVisibility) return;
    if (typeof modalState.externalWalletsConfig === "object") {
      // auto connect to WC if not injected to generate QR code URI for mobile connection
      const wcAvailable = (modalState.externalWalletsConfig[WALLET_CONNECTORS.WALLET_CONNECT_V2]?.showOnModal || false) !== false;
      if (wcAvailable && !modalState.walletConnectUri && typeof handleExternalWalletClick === "function") {
        handleExternalWalletClick({ connector: WALLET_CONNECTORS.WALLET_CONNECT_V2 });
      }
    }
  }, [modalState, handleExternalWalletClick]);

  if (widgetType === WIDGET_TYPE.MODAL) {
    return (
      <Modal
        open={modalState.modalVisibility}
        placement="center"
        padding={false}
        showCloseIcon={showCloseIcon}
        onClose={onCloseModal}
        borderRadius={uiConfig.borderRadiusType}
      >
        {/* This is to prevent the root from being mounted when the modal is not open. This results in the loader and modal state being updated again and again. */}
        {modalState.modalVisibility && (
          <Root
            showPasswordLessInput={showPasswordLessInput}
            showExternalWalletButton={showExternalWalletButton}
            handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
            areSocialLoginsVisible={areSocialLoginsVisible}
            isEmailPrimary={isEmailPrimary}
            isExternalPrimary={isExternalPrimary}
            showExternalWalletPage={showExternalWalletPage}
            handleExternalWalletBtnClick={handleExternalWalletBtnClick}
            preHandleExternalWalletClick={preHandleExternalWalletClick}
            onCloseLoader={onCloseLoader}
            isEmailPasswordLessLoginVisible={isEmailPasswordLessLoginVisible}
            isSmsPasswordLessLoginVisible={isSmsPasswordLessLoginVisible}
            isConnectAndSignAuthenticationMode={isConnectAndSignAuthenticationMode}
            handleMobileVerifyConnect={handleMobileVerifyConnect}
          />
        )}
      </Modal>
    );
  }

  return (
    <Embed open={modalState.modalVisibility} padding={false} onClose={onCloseModal} borderRadius={uiConfig.borderRadiusType}>
      {/* This is to prevent the root from being mounted when the modal is not open. This results in the loader and modal state being updated again and again. */}
      {modalState.modalVisibility && (
        <Root
          showPasswordLessInput={showPasswordLessInput}
          showExternalWalletButton={showExternalWalletButton}
          handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
          areSocialLoginsVisible={areSocialLoginsVisible}
          isEmailPrimary={isEmailPrimary}
          isExternalPrimary={isExternalPrimary}
          showExternalWalletPage={showExternalWalletPage}
          handleExternalWalletBtnClick={handleExternalWalletBtnClick}
          preHandleExternalWalletClick={preHandleExternalWalletClick}
          onCloseLoader={onCloseLoader}
          isEmailPasswordLessLoginVisible={isEmailPasswordLessLoginVisible}
          isSmsPasswordLessLoginVisible={isSmsPasswordLessLoginVisible}
          isConnectAndSignAuthenticationMode={isConnectAndSignAuthenticationMode}
          handleMobileVerifyConnect={handleMobileVerifyConnect}
        />
      )}
    </Embed>
  );
}

function Widget(props: WidgetProps) {
  const { stateListener } = props;
  const { uiConfig } = useWidget();
  const { widgetType } = uiConfig;

  const initialVisibility = useMemo(() => widgetType === WIDGET_TYPE.EMBED, [widgetType]);

  return (
    <ModalStateProvider stateListener={stateListener} initialVisibility={initialVisibility}>
      <WidgetContent />
    </ModalStateProvider>
  );
}

export default Widget;
