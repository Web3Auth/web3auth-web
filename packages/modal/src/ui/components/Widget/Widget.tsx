import { AUTH_CONNECTION, WEB3AUTH_NETWORK } from "@web3auth/auth";
import { cloneDeep, CONNECTOR_NAMES, log, WALLET_CONNECTORS, WIDGET_TYPE } from "@web3auth/no-modal";
import deepmerge from "deepmerge";
import { useEffect, useMemo, useState } from "react";

import { PAGES } from "../../constants";
import { type ExternalWalletEventType, MODAL_STATUS, ModalState, type SocialLoginEventType } from "../../interfaces";
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
    appLogo,
    appName,
    chainNamespaces,
    walletRegistry,
    uiConfig,
  } = props;

  const { widgetType } = uiConfig;

  const visible = useMemo(() => widgetType === WIDGET_TYPE.EMBED, [widgetType]);

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
    web3authClientId: "",
    web3authNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  });

  useEffect(() => {
    setModalState((prev) => ({ ...prev, modalVisibility: visible }));
  }, [visible]);

  useEffect(() => {
    stateListener.on("STATE_UPDATED", (newModalState: Partial<ModalState>) => {
      log.debug("state updated", newModalState);

      setModalState((prevState) => {
        const mergedState = cloneDeep(deepmerge(prevState, newModalState));
        return mergedState;
      });
    });
    stateListener.emit("MOUNTED");
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
      return { ...prevState, detailedLoaderConnector: loginParams.authConnection, detailedLoaderConnectorName: loginParams.name };
    });
    handleSocialLoginClick(params);
  };

  // Memo for checking if social logins are visible
  const areSocialLoginsVisible = useMemo(() => {
    if (modalState.showExternalWalletsOnly) return false;
    if (Object.keys(modalState.socialLoginsConfig?.loginMethods || {}).length === 0) return false;

    const isAnySocialLoginVisible = Object.entries(modalState.socialLoginsConfig?.loginMethods || {}).some(
      ([k, v]) => k !== AUTH_CONNECTION.EMAIL_PASSWORDLESS && v.showOnModal !== false
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
  const showExternalWalletButton = useMemo(() => modalState.hasExternalWallets, [modalState]);
  const showExternalWalletPage = useMemo(
    () => (areSocialLoginsVisible || showPasswordLessInput) && !modalState.externalWalletsVisibility,
    [areSocialLoginsVisible, showPasswordLessInput, modalState.externalWalletsVisibility]
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
  }, [modalState.status]);

  useEffect(() => {
    // TODO: maybe move this inside root
    if (typeof modalState.externalWalletsConfig === "object") {
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
            appLogo={appLogo}
            appName={appName}
            chainNamespaces={chainNamespaces}
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
            uiConfig={uiConfig}
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
          chainNamespaces={chainNamespaces}
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
          uiConfig={uiConfig}
        />
      )}
    </Embed>
  );
}

export default Widget;
