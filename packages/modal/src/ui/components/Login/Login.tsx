import { LOGIN_PROVIDER } from "@web3auth/auth";
import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { capitalizeFirstLetter } from "../../config";
import { rowType } from "../../interfaces";
import i18n from "../../localeImport";
import { cn, getIcons, validatePhoneNumber } from "../../utils";
import SocialLoginList from "../SocialLoginList/SocialLoginList";
import { LoginProps } from "./Login.type";
import LoginOtp from "./LoginOtp";
import LoginPasswordLess from "./LoginPasswordLess";

export const restrictedLoginMethods: string[] = [
  LOGIN_PROVIDER.WEBAUTHN,
  LOGIN_PROVIDER.JWT,
  LOGIN_PROVIDER.SMS_PASSWORDLESS,
  LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
  LOGIN_PROVIDER.AUTHENTICATOR,
  LOGIN_PROVIDER.PASSKEYS,
];

function Login(props: LoginProps) {
  const {
    // appName,
    // appLogo,
    handleSocialLoginHeight,
    socialLoginsConfig,
    isDark,
    // isEmailPrimary,
    // isExternalPrimary,
    handleSocialLoginClick,
    totalExternalWallets,
    isEmailPasswordLessLoginVisible,
    isSmsPasswordLessLoginVisible,
    handleExternalWalletBtnClick,
    areSocialLoginsVisible,
    showPasswordLessInput,
    showExternalWalletButton,
  } = props;

  const [t] = useTranslation(undefined, { i18n });

  const [fieldValue, setFieldValue] = useState<string>("");
  const [isValidInput, setIsValidInput] = useState<boolean>(true);
  const [expand, setExpand] = useState(false);
  const [canShowMore, setCanShowMore] = useState(false);
  const [visibleRow, setVisibleRow] = useState<rowType[]>([]);
  const [otherRow, setOtherRow] = useState<rowType[]>([]);
  const [isPasswordLessCtaClicked, setIsPasswordLessCtaClicked] = useState(false);
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [otpLoading, setOtpLoading] = useState(true);
  const [isMobileOtp, setIsMobileOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  const handleExpand = () => {
    setExpand((prev) => !prev);
    setIsPasswordLessCtaClicked(false);
    handleSocialLoginHeight();
  };

  useEffect(() => {
    const maxOptions = Object.keys(socialLoginsConfig.loginMethods).filter((loginMethodKey) => {
      return socialLoginsConfig.loginMethods[loginMethodKey].showOnModal;
    });

    const visibleRows: rowType[] = [];
    const otherRows: rowType[] = [];

    Object.keys(socialLoginsConfig.loginMethods)
      .filter((method) => {
        return !socialLoginsConfig.loginMethods[method].showOnModal === false && !restrictedLoginMethods.includes(method);
      })
      .forEach((method, index) => {
        const name = capitalizeFirstLetter(socialLoginsConfig.loginMethods[method].name || method);
        const orderIndex = socialLoginsConfig.loginMethodsOrder.indexOf(method) + 1;
        const order = orderIndex || index;

        const isMainOption = socialLoginsConfig.loginMethods[method].mainOption || order === 1;
        const isPrimaryBtn = socialLoginsConfig?.uiConfig?.primaryButton === "socialLogin" && order === 1;

        if (order > 0 && order < 4) {
          visibleRows.push({
            method,
            isDark,
            isPrimaryBtn,
            name,
            adapter: socialLoginsConfig.connector,
            loginParams: { loginProvider: method, name, login_hint: "" },
            order,
            isMainOption,
          });
        }

        otherRows.push({
          method,
          isDark,
          isPrimaryBtn,
          name: name === "Twitter" ? "X" : name,
          adapter: socialLoginsConfig.connector,
          loginParams: { loginProvider: method, name, login_hint: "" },
          order,
          isMainOption,
        });
      });

    setVisibleRow(visibleRows);
    setOtherRow(otherRows);
    setCanShowMore(maxOptions.length > 4); // Update the state based on the condition
  }, [socialLoginsConfig, isDark]);

  const handleFormSubmit = async (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // setShowOtpFlow(true);
    // setTimeout(() => {
    //   setOtpLoading(false);
    //   setIsMobileOtp(true);
    // }, 3000);

    const value = fieldValue;

    if (isEmailPasswordLessLoginVisible) {
      const isEmailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
      if (isEmailValid) {
        return handleSocialLoginClick({
          connector: socialLoginsConfig.connector || "",
          loginParams: { loginProvider: LOGIN_PROVIDER.EMAIL_PASSWORDLESS, login_hint: value, name: "Email" },
        });
      }
    }
    if (isSmsPasswordLessLoginVisible) {
      const countryCode = "";
      const number = value.startsWith("+") ? value : `${countryCode}${value}`;
      const result = await validatePhoneNumber(number);
      if (result) {
        return handleSocialLoginClick({
          connector: socialLoginsConfig.connector || "",
          loginParams: { loginProvider: LOGIN_PROVIDER.SMS_PASSWORDLESS, login_hint: typeof result === "string" ? result : number, name: "Mobile" },
        });
      }
    }

    setIsValidInput(false);
    return undefined;
  };

  const handleInputChange = (e: FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setFieldValue(target.value);
    if (isValidInput === false) setIsValidInput(true);
  };

  const title = useMemo(() => {
    if (isEmailPasswordLessLoginVisible && isSmsPasswordLessLoginVisible) return t("modal.social.passwordless-title");
    if (isEmailPasswordLessLoginVisible) return t("modal.social.email");
    return t("modal.social.phone");
  }, [isEmailPasswordLessLoginVisible, isSmsPasswordLessLoginVisible, t]);

  const placeholder = useMemo(() => {
    if (isEmailPasswordLessLoginVisible && isSmsPasswordLessLoginVisible) return "+(00)123456/name@example.com";
    if (isEmailPasswordLessLoginVisible) return "name@example.com";
    return "+(00)123456";
  }, [isEmailPasswordLessLoginVisible, isSmsPasswordLessLoginVisible]);

  const invalidInputErrorMessage = useMemo(() => {
    if (isEmailPasswordLessLoginVisible && isSmsPasswordLessLoginVisible) return t("modal.errors-invalid-number-email");
    if (isEmailPasswordLessLoginVisible) return t("modal.errors-invalid-email");
    return t("modal.errors-invalid-number");
  }, [isEmailPasswordLessLoginVisible, isSmsPasswordLessLoginVisible, t]);

  const handleConnectWallet = (e: ReactMouseEvent<HTMLButtonElement>) => {
    setIsPasswordLessCtaClicked(false);
    e.preventDefault();
    if (handleExternalWalletBtnClick) handleExternalWalletBtnClick(true);
  };

  const handleOtpComplete = (otp: string) => {
    // eslint-disable-next-line no-console
    console.log(otp);
    setOtpSuccess(true);
    setTimeout(() => {
      setOtpSuccess(false);
      setShowOtpFlow(false);
    }, 1000);
    setOtpLoading(false);
    setIsMobileOtp(false);
  };

  if (showOtpFlow) {
    return (
      <LoginOtp
        otpLoading={otpLoading}
        otpSuccess={otpSuccess}
        setShowOtpFlow={setShowOtpFlow}
        isMobileOtp={isMobileOtp}
        handleOtpComplete={handleOtpComplete}
      />
    );
  }

  return (
    <div className="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-4 w3a--p-4">
      <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2 w3a--pt-10">
        <figure className="w3a--w-[200px] w3a--h-12 mx-auto">
          <img src={getIcons(isDark ? "dark-logo" : "light-logo")} alt="Logo" className="w3a--object-contain" />
        </figure>
        <p className="w3a--text-lg w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">Sign In</p>
      </div>

      {expand && (
        <SocialLoginList
          otherRow={otherRow}
          isDark={isDark}
          visibleRow={visibleRow}
          canShowMore={canShowMore}
          handleSocialLoginClick={handleSocialLoginClick}
          socialLoginsConfig={socialLoginsConfig}
          handleExpandSocialLogins={handleExpand}
        />
      )}

      {!expand && areSocialLoginsVisible && (
        <SocialLoginList
          otherRow={[]}
          isDark={isDark}
          visibleRow={visibleRow}
          canShowMore={canShowMore}
          handleSocialLoginClick={handleSocialLoginClick}
          socialLoginsConfig={socialLoginsConfig}
          handleExpandSocialLogins={handleExpand}
        />
      )}

      {!expand && showPasswordLessInput && (
        <LoginPasswordLess
          isPasswordLessCtaClicked={isPasswordLessCtaClicked}
          setIsPasswordLessCtaClicked={setIsPasswordLessCtaClicked}
          title={title}
          fieldValue={fieldValue}
          handleInputChange={handleInputChange}
          placeholder={placeholder}
          handleFormSubmit={handleFormSubmit}
          invalidInputErrorMessage={invalidInputErrorMessage}
          isValidInput={isValidInput}
          isDark={isDark}
        />
      )}

      {!expand && showExternalWalletButton && showPasswordLessInput && (
        <div className="w3a--flex w3a--items-center w3a--gap-x-2 w3a--w-full">
          <div className="w3a--w-full w3a--h-[1px] w3a--bg-app-gray-200 dark:w3a--bg-app-gray-500" />
          <p className="w3a--text-xs w3a--font-normal w3a--text-app-gray-400 dark:w3a--text-app-gray-400 w3a--uppercase">or</p>
          <div className="w3a--w-full w3a--h-[1px] w3a--bg-app-gray-200 dark:w3a--bg-app-gray-500" />
        </div>
      )}

      {!expand && showExternalWalletButton && (
        <button type="button" className={cn("w3a--btn !w3a--justify-between w3a-external-wallet-btn")} onClick={handleConnectWallet}>
          <p className="w3a--text-app-gray-900 dark:w3a--text-app-white">{t("modal.external.connect")}</p>
          <div
            id="external-wallet-count"
            className="w3a--w-auto w3a--px-2.5 w3a--py-0.5 w3a--rounded-full w3a--bg-app-primary-100 dark:w3a--bg-transparent dark:w3a--border dark:w3a--border-app-primary-500 dark:w3a--text-app-primary-500 w3a--text-xs w3a--font-medium w3a--text-app-primary-800"
          >
            {totalExternalWallets - 1}+
          </div>
          <img
            id="external-wallet-arrow"
            className="w3a--icon-animation"
            src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
            alt="arrow"
          />
        </button>
      )}
    </div>
  );
}

export default Login;
