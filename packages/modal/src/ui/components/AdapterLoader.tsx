import { ADAPTER_STATUS, log } from "@web3auth/no-modal";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { MODAL_STATUS, ModalStatusType } from "../interfaces";
import i18n from "../localeImport";
// import Footer from "./Footer";
import Icon from "./Icon";
import Image from "./Image";

interface DetailedLoaderProps {
  message?: string;
  appLogo?: string;
  adapter: string;
  adapterName: string;
  modalStatus: ModalStatusType;
  onClose: () => void;
}

const closeIcon = <Icon iconName="x-light" darkIconName="close" />;

export default function DetailedLoader(props: DetailedLoaderProps) {
  const { adapter, appLogo, message, modalStatus, adapterName, onClose } = props;
  const providerIcon = adapter === "twitter" ? <Image imageId="login-x-dark" /> : <Image imageId={`login-${adapter}`} height="30" width="30" />;
  const [t] = useTranslation(undefined, { i18n });

  useEffect(() => {
    log.debug("adapter loader re-rendering");
    if (modalStatus === MODAL_STATUS.CONNECTED) {
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [modalStatus, onClose]);

  return modalStatus !== MODAL_STATUS.INITIALIZED ? (
    <div className="w3ajs-modal-loader w3a-modal__loader w3a--h-full">
      <div className="w3a-modal__loader-content">
        <div className="w3a-modal__loader-info">
          {modalStatus === MODAL_STATUS.CONNECTING && (
            <>
              <div className="w3a-modal__loader-bridge">
                <div className="w3a-modal__loader-app-logo">
                  <img src={appLogo} className="w3a--block dark:w3a--hidden w3a--h-10 w3a--w-10" alt="" />
                  <img src={appLogo} className="w3a--hidden dark:w3a--block w3a--h-10 w3a--w-10" alt="" />
                </div>
                <div className="w3a-modal__connector">
                  <div className="w3a-modal__connector-beat">
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                  </div>
                </div>
                <div className="w3a-modal__loader-social-logo">{providerIcon}</div>
              </div>
              <div>
                <div className="w3a-modal__loader-bridge-message">{t("modal.adapter-loader.message1", { adapter: adapterName })}</div>
                <div className="w3a-modal__loader-bridge-message">{t("modal.adapter-loader.message2", { adapter: adapterName })}</div>
              </div>
            </>
          )}
          {modalStatus === ADAPTER_STATUS.CONNECTED && (
            <div className="w3a--flex w3a--flex-col w3a--items-center">
              <Icon iconName="connected" />
              <div className="w3ajs-modal-loader__message w3a-spinner-message w3a--mt-4">{message}</div>
            </div>
          )}
          {modalStatus === ADAPTER_STATUS.ERRORED && (
            <div className="w3ajs-modal-loader__message w3a-spinner-message w3a-spinner-message--error">{message}</div>
          )}
        </div>
      </div>
      {(modalStatus === ADAPTER_STATUS.CONNECTED || modalStatus === ADAPTER_STATUS.ERRORED) && (
        <button type="button" className="w3a-header__button w3ajs-loader-close-btn" onClick={onClose}>
          {closeIcon}
        </button>
      )}
    </div>
  ) : null;
}
