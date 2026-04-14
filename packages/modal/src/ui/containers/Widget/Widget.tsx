import { WALLET_CONNECTORS, WIDGET_TYPE } from "@web3auth/no-modal";
import { useEffect, useMemo } from "react";

import Modal from "../../components/Modal";
import { PAGES } from "../../constants";
import { ModalStateProvider, useModalState } from "../../context/ModalStateContext";
import { useWidget } from "../../context/WidgetContext";
import { MODAL_STATUS } from "../../interfaces";
import Embed from "../Embed";
import Root from "../Root";
import { WidgetProps } from "./Widget.type";

function WidgetContent() {
  const { uiConfig, handleExternalWalletClick, closeModal, isConnectAndSignAuthenticationMode } = useWidget();

  const { modalState, setModalState } = useModalState();

  const { widgetType } = uiConfig;

  const onCloseModal = () => {
    setModalState((prevState) => ({
      ...prevState,
      externalWalletsVisibility: false,
      modalVisibility: false,
      currentPage: PAGES.LOGIN_OPTIONS,
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

  const rootElement = <Root onCloseLoader={onCloseLoader} />;

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
        {modalState.modalVisibility && rootElement}
      </Modal>
    );
  }

  return (
    <Embed open={modalState.modalVisibility} padding={false} onClose={onCloseModal} borderRadius={uiConfig.borderRadiusType}>
      {/* This is to prevent the root from being mounted when the modal is not open. This results in the loader and modal state being updated again and again. */}
      {modalState.modalVisibility && rootElement}
    </Embed>
  );
}

function Widget(props: WidgetProps) {
  const { stateListener } = props;

  return (
    <ModalStateProvider stateListener={stateListener}>
      <WidgetContent />
    </ModalStateProvider>
  );
}

export default Widget;
