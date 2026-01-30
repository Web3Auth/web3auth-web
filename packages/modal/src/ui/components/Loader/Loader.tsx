import { WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useWidget } from "../../context/WidgetContext";
import { MODAL_STATUS } from "../../interfaces";
import i18n from "../../localeImport";
import CircularLoader from "../CircularLoader";
import Image from "../Image";
import PulseLoader from "../PulseLoader";
import { AuthorizingStatusType, ConnectedStatusType, ConnectingStatusType, ErroredStatusType, LoaderProps } from "./Loader.type";

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

function AuthorizingStatus(props: AuthorizingStatusType) {
  const [t] = useTranslation(undefined, { i18n });
  const { walletRegistry } = useWidget();
  const { connector, externalWalletsConfig, handleMobileVerifyConnect } = props;

  const registryItem = walletRegistry?.default?.[connector] || walletRegistry?.others?.[connector];
  const primaryColor = registryItem?.primaryColor || "";

  const handleMobileVerifyConnectClick = () => {
    handleMobileVerifyConnect({ connector: connector as WALLET_CONNECTOR_TYPE });
  };

  return (
    <div className="w3a--flex w3a--size-full w3a--flex-col w3a--items-center w3a--justify-between w3a--gap-y-6">
      <p className="w3a--p-2 w3a--text-center w3a--text-base w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">
        {t("modal.loader.authorizing-header", { connector: externalWalletsConfig[connector].label })}
      </p>
      <div className="w3a--flex w3a--justify-center">
        <CircularLoader width={95} height={95} thickness={6} arcSizeDeg={100} arcColors={primaryColor ? [primaryColor, primaryColor] : undefined}>
          <Image imageId={`login-${connector}`} hoverImageId={`login-${connector}`} height="45" width="45" />
        </CircularLoader>
      </div>
      <p className="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-400">{t("modal.loader.authorizing-message")}</p>
      <button
        onClick={handleMobileVerifyConnectClick}
        className="w3a--w-full w3a--rounded-xl w3a--bg-app-gray-100 w3a--p-2 w3a--py-3 w3a--text-center w3a--text-sm w3a--text-app-gray-900 dark:w3a--bg-app-gray-800 dark:w3a--text-app-white md:w3a--hidden"
      >
        {t("modal.loader.authorizing-verify-btn")}
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
  const {
    connector,
    connectorName,
    modalStatus,
    onClose,
    message,
    isConnectAndSignAuthenticationMode,
    externalWalletsConfig,
    handleMobileVerifyConnect,
  } = props;

  const { appLogo } = useWidget();

  const isConnectedAccordingToAuthenticationMode = useMemo(
    () =>
      (!isConnectAndSignAuthenticationMode && modalStatus === MODAL_STATUS.CONNECTED) ||
      (isConnectAndSignAuthenticationMode && modalStatus === MODAL_STATUS.AUTHORIZED),
    [modalStatus, isConnectAndSignAuthenticationMode]
  );

  useEffect(() => {
    if (isConnectedAccordingToAuthenticationMode) {
      const timeout = setTimeout(() => {
        onClose();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [isConnectedAccordingToAuthenticationMode, onClose]);

  return (
    <div className="w3a--flex w3a--h-full w3a--flex-1 w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4">
      {modalStatus === MODAL_STATUS.CONNECTING && <ConnectingStatus connector={connector} connectorName={connectorName} appLogo={appLogo} />}

      {isConnectedAccordingToAuthenticationMode && <ConnectedStatus message={message} />}

      {modalStatus === MODAL_STATUS.ERRORED && <ErroredStatus message={message} />}

      {modalStatus === MODAL_STATUS.AUTHORIZING && (
        <AuthorizingStatus
          connector={connector}
          externalWalletsConfig={externalWalletsConfig}
          handleMobileVerifyConnect={handleMobileVerifyConnect}
        />
      )}
    </div>
  );
}

export default Loader;
