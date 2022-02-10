import { ADAPTER_STATUS } from "@web3auth/base";
import React, { useContext, useEffect } from "react";

import { ThemedContext } from "../context/ThemeContext";
import { MODAL_STATUS, ModalStatusType } from "../interfaces";
import Icon from "./Icon";
import Image from "./Image";

interface LoaderProps {
  message?: string;
  modalStatus: ModalStatusType;
  label?: string;
  onClose?: () => void;
}

const closeIcon = <Icon iconName="close" />;

export default function Loader(props: LoaderProps) {
  const { message, modalStatus, label, onClose } = props;
  const { isDark } = useContext(ThemedContext);
  // eslint-disable-next-line no-console
  console.log("isDark", isDark);
  const web3authIcon = <Image imageId={`web3auth${isDark ? "-light" : ""}`} />;

  useEffect(() => {
    if (modalStatus === MODAL_STATUS.CONNECTED && onClose) {
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [modalStatus]);

  return modalStatus && modalStatus !== MODAL_STATUS.INITIALIZED ? (
    <div className="w3ajs-modal-loader w3a-modal__loader">
      <div className="w3a-modal__loader-content">
        <div className="w3a-modal__loader-info">
          {modalStatus === MODAL_STATUS.CONNECTING && (
            <div className="w3ajs-modal-loader__spinner w3a-spinner">
              <div />
              <div />
              <div />
              <div />
            </div>
          )}

          <div className="w3ajs-modal-loader__label w3a-spinner-label">{label}</div>
          {modalStatus === ADAPTER_STATUS.CONNECTED && <div className="w3ajs-modal-loader__message w3a-spinner-message">{message}</div>}
          {modalStatus === ADAPTER_STATUS.ERRORED && (
            <div className="w3ajs-modal-loader__message w3a-spinner-message w3a-spinner-message--error">{message}</div>
          )}
        </div>
        <div className="w3a-spinner-power">
          <div>Secured by</div>
          {web3authIcon}
        </div>
      </div>
      {(modalStatus === ADAPTER_STATUS.CONNECTED || modalStatus === ADAPTER_STATUS.ERRORED) && (
        <button type="button" className="w3a-header__button w3ajs-loader-close-btn" onClick={onClose}>
          {closeIcon}
        </button>
      )}
    </div>
  ) : (
    <></>
  );
}
