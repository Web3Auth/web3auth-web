import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MODAL_STATUS } from "../../interfaces";
import i18n from "../../localeImport";
import CircularLoader from "../CircularLoader";
import Image from "../Image";
import PulseLoader from "../PulseLoader";
import { ConnectedStatusType, ConnectingStatusType, ErroredStatusType, LoaderProps } from "./Loader.type";

/**
 * ConnectingStatus component
 * @param props - ConnectingStatusType
 * @returns ConnectingStatus component
 */
function ConnectingStatus(props: ConnectingStatusType) {
  const [t] = useTranslation(undefined, { i18n });
  const { connector, appLogo, connectorName } = props;

  const providerIcon = useMemo(
    () => (connector === "twitter" ? <Image imageId="login-x-dark" /> : <Image imageId={`login-${connector}`} height="40" width="40" />),
    [connector]
  );

  return (
    <div className="w3a--flex w3a--h-full w3a--flex-1 w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4">
      <div className="w3a--flex w3a--items-center w3a--justify-center w3a--gap-x-6">
        <figure className="w3a--flex w3a--size-10 w3a--items-center w3a--justify-center w3a--overflow-hidden">
          <img src={appLogo} alt="" className="w3a--size-full w3a--object-contain" />
        </figure>

        <PulseLoader />

        {providerIcon}
      </div>
      <div className="w3a--flex w3a--flex-col w3a--gap-y-1">
        <div className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-400">
          {t("modal.adapter-loader.message1", { adapter: connectorName })}
        </div>
        <div className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-400">
          {t("modal.adapter-loader.message2", { adapter: connectorName })}
        </div>
      </div>
    </div>
  );
}

/**
 * ConnectedStatus component
 * @param props - ConnectedStatusType
 * @returns ConnectedStatus component
 */
function ConnectedStatus(props: ConnectedStatusType) {
  const { message } = props;
  return (
    <div className="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="w3a--connected-logo">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M6.267 3.455a3.07 3.07 0 0 0 1.745-.723 3.066 3.066 0 0 1 3.976 0 3.07 3.07 0 0 0 1.745.723 3.066 3.066 0 0 1 2.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 0 1 0 3.976 3.07 3.07 0 0 0-.723 1.745 3.066 3.066 0 0 1-2.812 2.812 3.07 3.07 0 0 0-1.745.723 3.066 3.066 0 0 1-3.976 0 3.07 3.07 0 0 0-1.745-.723 3.066 3.066 0 0 1-2.812-2.812 3.07 3.07 0 0 0-.723-1.745 3.066 3.066 0 0 1 0-3.976 3.07 3.07 0 0 0 .723-1.745 3.066 3.066 0 0 1 2.812-2.812m7.44 5.252a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0z"
          clipRule="evenodd"
        />
      </svg>
      <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-400">{message}</p>
    </div>
  );
}

/**
 * ErroredStatus component
 * @param props - ErroredStatusType
 * @returns ErroredStatus component
 */
function ErroredStatus(props: ErroredStatusType) {
  const { message } = props;
  return (
    <div className="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="w3a--error-logo">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16.001 0A8 8 0 0 1 18 10m-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1"
          clipRule="evenodd"
        />
      </svg>
      <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-400">{message}</p>
    </div>
  );
}

function AuthorizingStatus() {
  return (
    <div className="w3a--flex w3a--size-full w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-6">
      <p className="w3a--p-2 w3a--text-center w3a--text-base w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">
        Verify on MetaMask
      </p>
      <div className="w3a--flex w3a--justify-center">
        <CircularLoader width={95} height={95} thickness={6} arcSizeDeg={100}>
          <Image
            imageId={`login-metamask`}
            hoverImageId={`login-metamask`}
            fallbackImageId="wallet"
            height="45"
            width="45"
            isButton
            extension="svg"
          />
        </CircularLoader>
      </div>
      <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-400">
        We’ve sent a request to your wallet. Verify on your wallet to confirm that you own this wallet.
      </p>
      <button className="w3a--w-full w3a--rounded-xl w3a--bg-app-gray-100 w3a--p-2 w3a--py-3 w3a--text-sm w3a--text-app-gray-900 dark:w3a--bg-app-gray-800 dark:w3a--text-app-white">
        Click here to verify
      </button>
    </div>
  );
}

/**
 * Loader component
 * @param props - LoaderProps
 * @returns Loader component
 */
function Loader(props: LoaderProps) {
  const { connector, connectorName, modalStatus, onClose, appLogo, message, isConnectAndSignAuthenticationMode } = props;

  useEffect(() => {
    if (modalStatus === MODAL_STATUS.CONNECTED) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
    if (isConnectAndSignAuthenticationMode && modalStatus === MODAL_STATUS.AUTHORIZED) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  }, [modalStatus, onClose, isConnectAndSignAuthenticationMode]);

  return (
    <div className="w3a--flex w3a--h-full w3a--flex-1 w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4">
      {modalStatus === MODAL_STATUS.CONNECTING && <ConnectingStatus connector={connector} connectorName={connectorName} appLogo={appLogo} />}

      {(modalStatus === MODAL_STATUS.CONNECTED || modalStatus === MODAL_STATUS.AUTHORIZED) && <ConnectedStatus message={message} />}

      {modalStatus === MODAL_STATUS.ERRORED && <ErroredStatus message={message} />}

      {modalStatus === MODAL_STATUS.AUTHORIZING && <AuthorizingStatus />}
    </div>
  );
}

export default Loader;
