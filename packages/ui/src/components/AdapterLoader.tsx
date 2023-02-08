import { ADAPTER_STATUS, log } from "@web3auth/base";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT, MODAL_STATUS, ModalStatusType } from "../interfaces";
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

const closeIcon = <Icon iconName="close" />;

export default function DetailedLoader(props: DetailedLoaderProps) {
  const { adapter, appLogo, message, modalStatus, adapterName, onClose } = props;
  const web3authIcon = <Image imageId="web3auth" />;
  const providerIcon = <Image imageId={`login-${adapter}`} />;
  const [t] = useTranslation();
  const isDefaultLogo = [DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT].includes(appLogo);

  useEffect(() => {
    log.debug("adapter loader re-rendering");
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
                <div className={["w3a-modal__loader-app-logo", isDefaultLogo ? "w3a-modal__loader-app-logo--default" : ""].join(" ")}>
                  <img src={appLogo} alt="" />
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
            <div className="flex flex-col items-center">
              <Icon iconName="connected" />
              <div className="w3ajs-modal-loader__message w3a-spinner-message mt-4">{message}</div>
            </div>
          )}
          {modalStatus === ADAPTER_STATUS.ERRORED && (
            <div className="w3ajs-modal-loader__message w3a-spinner-message w3a-spinner-message--error">{message}</div>
          )}
        </div>
        <div className="w3a-spinner-power">
          <div>{t("modal.footer.message")}</div>
          {web3authIcon}
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
