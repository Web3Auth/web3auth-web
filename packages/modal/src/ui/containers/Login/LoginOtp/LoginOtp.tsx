import { AUTH_CONNECTION } from "@web3auth/auth";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import Otp from "../../../components/Otp";
import i18n from "../../../localeImport";
import { getIcons } from "../../../utils";
import { LoginOtpProps, OtpInputProps } from "./LoginOtp.type";

/**
 * OtpInput component
 * @param props - OtpInputProps
 * @returns OtpInput component
 */
function OtpInput(props: OtpInputProps) {
  const { setShowOtpFlow, handleOtpComplete, authConnection, loginHint = "", errorMessage, otpLoading, countryFlag } = props;
  const isMobileOtp = useMemo(() => authConnection === AUTH_CONNECTION.SMS_PASSWORDLESS, [authConnection]);
  const [t] = useTranslation(undefined, { i18n });

  const parsedLoginHint = useMemo(() => {
    if (authConnection === AUTH_CONNECTION.EMAIL_PASSWORDLESS) return loginHint;

    const [countryCode, number] = loginHint.includes("-") ? loginHint.split("-") : ["", loginHint];
    const masked = `${number}`.slice(-Math.floor((number as string).length / 2)).padStart(`${number}`.length, "*");
    return `${countryFlag} ${countryCode} ${masked}`;
  }, [loginHint, authConnection, countryFlag]);

  return (
    <>
      <div className="wta:mr-auto wta:flex wta:w-full wta:items-start wta:justify-start">
        <button
          type="button"
          className="wta:z-20 wta:flex wta:size-5 wta:cursor-pointer wta:items-center wta:justify-center wta:rounded-full"
          onClick={() => setShowOtpFlow(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="wta:text-app-gray-900 wta:dark:text-app-white">
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="wta:-mt-10 wta:flex wta:size-full wta:flex-1 wta:flex-col wta:items-center wta:justify-center wta:gap-y-4">
        <img src={getIcons(isMobileOtp ? "sms-otp-light" : "email-otp-light")} alt="otp" className="wta:size-auto" />
        <div className="wta:mx-auto wta:-mt-6 wta:flex wta:w-full wta:flex-col wta:items-center wta:justify-center wta:gap-y-2">
          <p className="wta:text-lg wta:font-bold wta:text-app-gray-900 wta:dark:text-app-white">
            {isMobileOtp ? t("modal.otp.mobile-title") : t("modal.otp.email-title")}
          </p>
          <div className="wta:mx-auto wta:flex wta:w-full wta:flex-col wta:items-center wta:justify-center wta:gap-y-1">
            <p className="wta:text-center wta:text-sm wta:font-normal wta:text-app-gray-500 wta:dark:text-app-gray-300">
              {isMobileOtp ? t("modal.otp.mobile-subtext") : t("modal.otp.email-subtext")}
            </p>
            <p className="wta:text-center wta:text-sm wta:font-normal wta:text-app-gray-500 wta:dark:text-app-gray-300">
              {isMobileOtp ? parsedLoginHint : t("modal.otp.email-subtext-example", { email: parsedLoginHint })}
            </p>
          </div>
        </div>
        <Otp
          length={6}
          onComplete={handleOtpComplete}
          error={Boolean(errorMessage)}
          helperText={errorMessage}
          loading={otpLoading}
          disabled={otpLoading}
        />
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
  const { otpLoading, setShowOtpFlow, handleOtpComplete, authConnection, loginHint, errorMessage, countryFlag } = props;

  return (
    <div className="wta:flex wta:size-full wta:flex-1 wta:flex-col wta:items-center wta:justify-center wta:gap-y-4">
      <OtpInput
        errorMessage={errorMessage}
        setShowOtpFlow={setShowOtpFlow}
        handleOtpComplete={handleOtpComplete}
        authConnection={authConnection}
        loginHint={loginHint}
        otpLoading={otpLoading}
        countryFlag={countryFlag}
      />
    </div>
  );
}

export default LoginOtp;
