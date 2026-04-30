import { WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MODAL_STATUS } from "../../interfaces";
import i18n from "../../localeImport";
import Image from "../Image";
import SpinnerLoader from "../SpinnerLoader";
import { AuthorizingStatusType, ConnectedStatusType, ConnectingStatusType, ErroredStatusType, LoaderProps } from "./Loader.type";

/**
 * ConnectingStatus component
 * @param props - ConnectingStatusType
 * @returns ConnectingStatus component
 */
function ConnectingStatus(props: ConnectingStatusType) {
  const [t] = useTranslation(undefined, { i18n });
  const { connector, connectorName } = props;

  const providerIcon = useMemo(
    () => (connector === "twitter" ? <Image imageId="login-x-dark" /> : <Image imageId={`login-${connector}`} height="40" width="40" />),
    [connector]
  );

  return (
    <div className="wta:flex wta:h-full wta:flex-1 wta:flex-col wta:items-center wta:justify-center wta:gap-y-4">
      <SpinnerLoader width={95} height={95}>
        {providerIcon}
      </SpinnerLoader>
      <div className="wta:flex wta:flex-col wta:gap-y-1">
        <div className="wta:text-center wta:text-sm wta:text-app-gray-500 wta:dark:text-app-gray-400">
          {t("modal.adapter-loader.message1", { adapter: connectorName })}
        </div>
        <div className="wta:text-center wta:text-sm wta:text-app-gray-500 wta:dark:text-app-gray-400">
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
    <div className="wta:flex wta:flex-col wta:items-center wta:gap-y-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="w3a--connected-logo">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M6.267 3.455a3.07 3.07 0 0 0 1.745-.723 3.066 3.066 0 0 1 3.976 0 3.07 3.07 0 0 0 1.745.723 3.066 3.066 0 0 1 2.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 0 1 0 3.976 3.07 3.07 0 0 0-.723 1.745 3.066 3.066 0 0 1-2.812 2.812 3.07 3.07 0 0 0-1.745.723 3.066 3.066 0 0 1-3.976 0 3.07 3.07 0 0 0-1.745-.723 3.066 3.066 0 0 1-2.812-2.812 3.07 3.07 0 0 0-.723-1.745 3.066 3.066 0 0 1 0-3.976 3.07 3.07 0 0 0 .723-1.745 3.066 3.066 0 0 1 2.812-2.812m7.44 5.252a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0z"
          clipRule="evenodd"
        />
      </svg>
      <p className="wta:text-center wta:text-sm wta:text-app-gray-500 wta:dark:text-app-gray-400">{message}</p>
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
    <div className="wta:flex wta:flex-col wta:items-center wta:gap-y-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="w3a--error-logo">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16.001 0A8 8 0 0 1 18 10m-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1"
          clipRule="evenodd"
        />
      </svg>
      <p className="wta:text-center wta:text-sm wta:text-app-gray-500 wta:dark:text-app-gray-400">{message}</p>
    </div>
  );
}

function AuthorizingStatus(props: AuthorizingStatusType) {
  const [t] = useTranslation(undefined, { i18n });
  const { connector, externalWalletsConfig, handleMobileVerifyConnect } = props;

  const handleMobileVerifyConnectClick = () => {
    handleMobileVerifyConnect({ connector: connector as WALLET_CONNECTOR_TYPE });
  };

  return (
    <div className="wta:flex wta:size-full wta:flex-col wta:items-center wta:justify-between wta:gap-y-6">
      <p className="wta:p-2 wta:text-center wta:text-base wta:font-semibold wta:text-app-gray-900 wta:dark:text-app-white">
        {t("modal.loader.authorizing-header", { connector: externalWalletsConfig[connector]?.label })}
      </p>
      <div className="wta:flex wta:justify-center">
        <SpinnerLoader width={95} height={95}>
          <Image imageId={`login-${connector}`} hoverImageId={`login-${connector}`} height="45" width="45" />
        </SpinnerLoader>
      </div>
      <p className="wta:text-center wta:text-sm wta:text-app-gray-500 wta:dark:text-app-gray-400">{t("modal.loader.authorizing-message")}</p>
      <button
        onClick={handleMobileVerifyConnectClick}
        className="wta:w-full wta:rounded-xl wta:bg-app-gray-100 wta:p-2 wta:py-3 wta:text-center wta:text-sm wta:text-app-gray-900 wta:dark:bg-app-gray-800 wta:dark:text-app-white wta:md:hidden"
      >
        {t("modal.loader.authorizing-verify-btn")}
      </button>
    </div>
  );
}

function ConsentRequiredStatus(props: {
  onAccept?: () => void | Promise<void>;
  onDecline?: () => void | Promise<void>;
  privacyPolicy?: string;
  tncLink?: string;
}) {
  const { onAccept, onDecline, privacyPolicy, tncLink } = props;
  const [t] = useTranslation(undefined, { i18n });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await onAccept?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await onDecline?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wta:flex wta:w-full wta:flex-col wta:items-center wta:gap-y-6 wta:mt-8">
      <div className="wta:flex wta:items-center wta:justify-center wta:p-3 wta:bg-app-gray-100 wta:dark:bg-app-gray-800 wta:rounded-full wta:text-app-gray-600 wta:dark:text-app-white">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="wta:size-10">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2"
          ></path>
        </svg>
      </div>
      <div className="wta:w-full wta:px-8 wta:text-center wta:text-app-gray-900 wta:dark:text-app-white">
        {t("modal.consent.description", { defaultValue: "To proceed, please accept the terms and privacy policy" })}
      </div>
      {(tncLink || privacyPolicy) && (
        <div className="wta:flex wta:w-full wta:flex-col wta:gap-y-2">
          {tncLink && (
            <a
              href={tncLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w3a--btn wta:text-sm! wta:font-light wta:justify-start! wta:rounded-full wta:border-app-gray-50 wta:bg-app-gray-50 wta:p-3 wta:text-left wta:text-app-gray-700 wta:hover:border-app-gray-200 wta:hover:bg-app-gray-200 wta:hover:text-app-gray-900 wta:dark:border-app-gray-800 wta:dark:bg-app-gray-800 wta:dark:text-app-white wta:dark:hover:border-app-gray-600 wta:dark:hover:bg-app-gray-600"
            >
              {t("modal.consent.tnc", { defaultValue: "Terms of service" })}
            </a>
          )}
          {privacyPolicy && (
            <a
              href={privacyPolicy}
              target="_blank"
              rel="noopener noreferrer"
              className="w3a--btn wta:text-sm! wta:font-light wta:justify-start! wta:rounded-full wta:border-app-gray-50 wta:bg-app-gray-50 wta:p-3 wta:text-left wta:text-app-gray-700 wta:hover:border-app-gray-200 wta:hover:bg-app-gray-200 wta:hover:text-app-gray-900 wta:dark:border-app-gray-800 wta:dark:bg-app-gray-800 wta:dark:text-app-white wta:dark:hover:border-app-gray-600 wta:dark:hover:bg-app-gray-600"
            >
              {t("modal.consent.privacy", { defaultValue: "Privacy Policy" })}
            </a>
          )}
        </div>
      )}
      <div className="wta:flex wta:w-full wta:gap-x-2">
        <button type="button" disabled={isSubmitting} onClick={handleDecline} className="w3a--btn wta:rounded-full wta:disabled:opacity-60">
          <p className="wta:text-app-gray-900 wta:dark:text-app-white">{t("modal.consent.decline", { defaultValue: "Decline" })}</p>
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleAccept}
          className="w3a--btn wta:rounded-full wta:border-app-primary-600 wta:bg-app-primary-600 wta:hover:border-app-primary-700 wta:hover:bg-app-primary-700 wta:disabled:opacity-60 wta:dark:border-app-primary-600 wta:dark:bg-app-primary-600 wta:dark:hover:border-app-primary-700 wta:dark:hover:bg-app-primary-700"
        >
          <p className="wta:text-app-onPrimary">{t("modal.consent.accept", { defaultValue: "Accept" })}</p>
        </button>
      </div>
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
    hideSuccessScreen = false,
    onAcceptConsent,
    onDeclineConsent,
    privacyPolicy,
    tncLink,
  } = props;

  const isConnectedAccordingToAuthenticationMode = useMemo(
    () =>
      (!isConnectAndSignAuthenticationMode && modalStatus === MODAL_STATUS.CONNECTED) ||
      (isConnectAndSignAuthenticationMode && modalStatus === MODAL_STATUS.AUTHORIZED),
    [modalStatus, isConnectAndSignAuthenticationMode]
  );

  useEffect(() => {
    if (isConnectedAccordingToAuthenticationMode) {
      // If hideSuccessScreen is true, skip success screen entirely (delay = 0)
      // Otherwise, show success screen for 1 second for all login types
      const delay = hideSuccessScreen ? 0 : 1000;
      const timeout = setTimeout(() => {
        onClose();
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [isConnectedAccordingToAuthenticationMode, hideSuccessScreen, onClose]);

  const isConsentRequiringStatus = modalStatus === MODAL_STATUS.CONSENT_REQUIRING;

  return (
    <div
      className={
        isConsentRequiringStatus
          ? "wta:flex wta:flex-col wta:items-center wta:justify-center wta:gap-y-4"
          : "wta:flex wta:h-full wta:flex-1 wta:flex-col wta:items-center wta:justify-center wta:gap-y-4"
      }
    >
      {modalStatus === MODAL_STATUS.CONNECTING && <ConnectingStatus connector={connector} connectorName={connectorName} />}

      {isConnectedAccordingToAuthenticationMode && !hideSuccessScreen && <ConnectedStatus message={message} />}

      {modalStatus === MODAL_STATUS.ERRORED && <ErroredStatus message={message} />}

      {modalStatus === MODAL_STATUS.AUTHORIZING && (
        <AuthorizingStatus
          connector={connector}
          externalWalletsConfig={externalWalletsConfig}
          handleMobileVerifyConnect={handleMobileVerifyConnect}
        />
      )}

      {isConsentRequiringStatus && (
        <ConsentRequiredStatus onAccept={onAcceptConsent} onDecline={onDeclineConsent} privacyPolicy={privacyPolicy} tncLink={tncLink} />
      )}
    </div>
  );
}

export default Loader;
