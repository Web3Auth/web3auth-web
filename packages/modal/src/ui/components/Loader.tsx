import { CONNECTOR_STATUS, log } from "@web3auth/no-modal";
import { useEffect } from "react";

import { MODAL_STATUS, ModalStatusType } from "../interfaces";
// import Footer from "./Footer";
import Icon from "./Icon";

interface LoaderProps {
  message?: string;
  modalStatus: ModalStatusType;
  label?: string;
  onClose?: () => void;
  canEmit?: boolean;
}

const closeIcon = <Icon iconName="close" />;

export default function Loader(props: LoaderProps) {
  const { message, modalStatus, label, onClose, canEmit = true } = props;

  useEffect(() => {
    log.debug("loader re-rendering");
    if (modalStatus === MODAL_STATUS.CONNECTED && canEmit) {
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [canEmit, modalStatus, onClose]);

  return modalStatus !== MODAL_STATUS.INITIALIZED ? (
    <div className="w3ajs-modal-loader w3a-modal__loader">
      <div className="w3a-modal__loader-content">
        <div className="w3a-modal__loader-info">
          {modalStatus === MODAL_STATUS.CONNECTING && (
            <div className="w3ajs-modal-loader__spinner w3a-spinner">
              <div className="w3a-spinner__spinner" />
            </div>
          )}

          <div className="w3ajs-modal-loader__label w3a-spinner-label">{label}</div>
          {modalStatus === CONNECTOR_STATUS.CONNECTED && <div className="w3ajs-modal-loader__message w3a-spinner-message">{message}</div>}
          {modalStatus === CONNECTOR_STATUS.ERRORED && (
            <div className="w3ajs-modal-loader__message w3a-spinner-message w3a-spinner-message--error">{message}</div>
          )}
        </div>

        {/* <Footer /> */}
      </div>
      {(modalStatus === CONNECTOR_STATUS.CONNECTED || modalStatus === CONNECTOR_STATUS.ERRORED) && (
        <button type="button" className="w3a-header__button w3ajs-loader-close-btn" onClick={onClose}>
          {closeIcon}
        </button>
      )}
    </div>
  ) : null;
}
