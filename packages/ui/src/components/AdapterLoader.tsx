import { CONNECTOR_STATUS, log } from "@web3auth/base";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { MODAL_STATUS, ModalStatusType } from "../interfaces";
import i18n from "../localeImport";
import Footer from "./Footer";
import Icon from "./Icon";
import Image from "./Image";

interface DetailedLoaderProps {
  message?: string;
  appLogo?: string;
  connector: string;
  connectorName: string;
  modalStatus: ModalStatusType;
  onClose: () => void;
}

const closeIcon = <Icon iconName="close" />;

export default function DetailedLoader(props: DetailedLoaderProps) {
  const { connector, appLogo, message, modalStatus, connectorName, onClose } = props;
  const providerIcon = connector === "twitter" ? <Image imageId="login-x-dark" /> : <Image imageId={`login-${connector}`} />;
  const [t] = useTranslation(undefined, { i18n });

  useEffect(() => {
    log.debug("connector loader re-rendering");
    if (modalStatus === MODAL_STATUS.CONNECTED) {
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [modalStatus, onClose]);

  return modalStatus !== MODAL_STATUS.INITIALIZED ? (
    <div className="w3ajs-modal-loader w3a-modal__loader">
      <div className="w3a-modal__loader-content">
        <div className="w3a-modal__loader-info">
          {modalStatus === MODAL_STATUS.CONNECTING && (
            <>
              <div className="w3a-modal__loader-bridge">
                <div className="w3a-modal__loader-app-logo">
                  <img src={appLogo} className="block dark:hidden" alt="" />
                  <img src={appLogo} className="hidden dark:block" alt="" />
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
                <div className="w3a-modal__loader-bridge-message">{t("modal.adapter-loader.message1", { adapter: connectorName })}</div>
                <div className="w3a-modal__loader-bridge-message">{t("modal.adapter-loader.message2", { adapter: connectorName })}</div>
              </div>
            </>
          )}
          {modalStatus === CONNECTOR_STATUS.CONNECTED && (
            <div className="flex flex-col items-center">
              <Icon iconName="connected" />
              <div className="w3ajs-modal-loader__message w3a-spinner-message mt-4">{message}</div>
            </div>
          )}
          {modalStatus === CONNECTOR_STATUS.ERRORED && (
            <div className="w3ajs-modal-loader__message w3a-spinner-message w3a-spinner-message--error">{message}</div>
          )}
        </div>

        <Footer />
      </div>
      {(modalStatus === CONNECTOR_STATUS.CONNECTED || modalStatus === CONNECTOR_STATUS.ERRORED) && (
        <button type="button" className="w3a-header__button w3ajs-loader-close-btn" onClick={onClose}>
          {closeIcon}
        </button>
      )}
    </div>
  ) : null;
}
