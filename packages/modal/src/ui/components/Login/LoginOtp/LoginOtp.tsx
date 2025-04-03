import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import { getIcons } from "../../../utils";
import Otp from "../../Otp";
import { LoginOtpProps, OtpInputProps } from "./LoginOtp.type";

/**
 * OtpInput component
 * @param props - OtpInputProps
 * @returns OtpInput component
 */
function OtpInput(props: OtpInputProps) {
  const { isMobileOtp, otpSuccess, setShowOtpFlow, handleOtpComplete } = props;

  const [t] = useTranslation(undefined, { i18n });

  if (otpSuccess) {
    return (
      <div className="w3a--flex w3a--size-full w3a--flex-1 w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4">
        <img src={getIcons("success-light")} alt="success" className="w3a--size-auto" />
        <p className="w3a--mx-auto w3a--w-4/5 w3a--text-center w3a--text-base w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
          {t("modal.otp.success")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="w3a--mr-auto w3a--flex w3a--w-full w3a--items-start w3a--justify-start">
        <button
          type="button"
          className="w3a--z-20 w3a--flex w3a--size-5 w3a--cursor-pointer w3a--items-center w3a--justify-center w3a--rounded-full"
          onClick={() => setShowOtpFlow(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="w3a--text-app-gray-900 dark:w3a--text-app-white">
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="w3a--flex w3a--size-full w3a--flex-1 w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4">
        <img src={getIcons(isMobileOtp ? "sms-otp-light" : "email-otp-light")} alt="otp" className="w3a--size-auto" />
        <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2">
          <p className="w3a--text-lg w3a--font-bold w3a--text-app-gray-900 dark:w3a--text-app-white">
            {isMobileOtp ? t("modal.otp.mobile-title") : t("modal.otp.email-title")}
          </p>
          <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-1">
            <p className="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">
              {isMobileOtp ? t("modal.otp.mobile-subtext") : t("modal.otp.email-subtext")}
            </p>
            <p className="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">
              {isMobileOtp ? "🇸🇬+91 ****0999" : t("modal.otp.email-subtext-example", { email: "ja****@email.com" })}
            </p>
          </div>
        </div>
        <Otp length={6} onComplete={handleOtpComplete} />
      </div>
    </>
  );
}

/**
 * LoginOtp component
 * @param props - LoginOtpProps
 * @returns LoginOtp component
 */
function LoginOtp(props: LoginOtpProps) {
  const { otpLoading, otpSuccess, setShowOtpFlow, isMobileOtp, handleOtpComplete } = props;

  return (
    <div className="w3a--flex w3a--size-full w3a--flex-1 w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4">
      {otpLoading ? (
        <div className="w3a--flex w3a--size-full w3a--flex-1 w3a--items-center w3a--justify-center w3a--gap-x-2 w3a--gap-y-4">
          <div className="w3a--size-3 w3a--animate-pulse w3a--rounded-full w3a--bg-app-primary-600 dark:w3a--bg-app-primary-500" />
          <div className="w3a--size-3 w3a--animate-pulse w3a--rounded-full w3a--bg-app-primary-500 dark:w3a--bg-app-primary-400" />
          <div className="w3a--size-3 w3a--animate-pulse w3a--rounded-full w3a--bg-app-primary-400 dark:w3a--bg-app-primary-300" />
        </div>
      ) : (
        <OtpInput isMobileOtp={isMobileOtp} otpSuccess={otpSuccess} setShowOtpFlow={setShowOtpFlow} handleOtpComplete={handleOtpComplete} />
      )}
    </div>
  );
}

export default LoginOtp;
