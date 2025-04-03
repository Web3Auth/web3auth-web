import HCaptcha from "@hcaptcha/react-hcaptcha";
import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import { log } from "@web3auth/no-modal";
import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { capitalizeFirstLetter, CAPTCHA_SITE_KEY } from "../../config";
import { PasswordlessHandler } from "../../handlers/AbstractHandler";
import { createPasswordlessHandler } from "../../handlers/factory";
import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT, rowType } from "../../interfaces";
import i18n from "../../localeImport";
import { cn, getIcons, validatePhoneNumber } from "../../utils";
import SocialLoginList from "../SocialLoginList/SocialLoginList";
import { LoginProps } from "./Login.type";
import LoginOtp from "./LoginOtp";
import LoginPasswordLess from "./LoginPasswordLess";

const restrictedLoginMethods: string[] = [
  AUTH_CONNECTION.SMS_PASSWORDLESS,
  AUTH_CONNECTION.EMAIL_PASSWORDLESS,
  AUTH_CONNECTION.AUTHENTICATOR,
  AUTH_CONNECTION.PASSKEYS,
  AUTH_CONNECTION.TELEGRAM,
  AUTH_CONNECTION.CUSTOM,
];

function Login(props: LoginProps) {
  const {
    // appName,
    web3authClientId,
    web3authNetwork,
    appLogo,
    isModalVisible,
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

  const [isValidInput, setIsValidInput] = useState<boolean>(true);
  const [expand, setExpand] = useState(false);
  const [canShowMore, setCanShowMore] = useState(false);
  const [visibleRow, setVisibleRow] = useState<rowType[]>([]);
  const [otherRow, setOtherRow] = useState<rowType[]>([]);
  const [isPasswordLessCtaClicked, setIsPasswordLessCtaClicked] = useState(false);
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [authConnection, setAuthConnection] = useState<AUTH_CONNECTION_TYPE | undefined>(undefined);
  const [passwordlessHandler, setPasswordlessHandler] = useState<PasswordlessHandler | undefined>(undefined);
  const [isPasswordLessLoading, setIsPasswordLessLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState<string>("");
  const captchaRef = useRef<HCaptcha>(null);

  const handleExpand = () => {
    setExpand((prev) => !prev);
    setIsPasswordLessCtaClicked(false);
    handleSocialLoginHeight();
  };

  useEffect(() => {
    const maxOptions = Object.keys(socialLoginsConfig.loginMethods).filter((loginMethodKey) => {
      return socialLoginsConfig.loginMethods[loginMethodKey as AUTH_CONNECTION_TYPE].showOnModal;
    });

    const visibleRows: rowType[] = [];
    const otherRows: rowType[] = [];

    Object.keys(socialLoginsConfig.loginMethods)
      .filter((method) => {
        return !socialLoginsConfig.loginMethods[method as AUTH_CONNECTION_TYPE].showOnModal === false && !restrictedLoginMethods.includes(method);
      })
      .forEach((method, index) => {
        const connectorConfig = socialLoginsConfig.loginMethods[method as AUTH_CONNECTION_TYPE];
        const name = capitalizeFirstLetter(connectorConfig.name || method);
        const orderIndex = socialLoginsConfig.loginMethodsOrder.indexOf(method) + 1;
        const order = orderIndex || index;

        const isMainOption = connectorConfig.mainOption || order === 1;
        const isPrimaryBtn = socialLoginsConfig?.uiConfig?.primaryButton === "socialLogin" && order === 1;

        if (order > 0 && order < 4) {
          visibleRows.push({
            method,
            isDark,
            isPrimaryBtn,
            name,
            adapter: socialLoginsConfig.connector,
            loginParams: {
              authConnection: connectorConfig.authConnection || (method as AUTH_CONNECTION_TYPE),
              authConnectionId: connectorConfig.authConnectionId,
              groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
              extraLoginOptions: connectorConfig.extraLoginOptions,
              name,
              login_hint: "",
            },
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
          loginParams: {
            authConnection: connectorConfig.authConnection || (method as AUTH_CONNECTION_TYPE),
            authConnectionId: connectorConfig.authConnectionId,
            groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
            extraLoginOptions: connectorConfig.extraLoginOptions,
            name,
            login_hint: "",
          },
          order,
          isMainOption,
        });
      });

    setVisibleRow(visibleRows);
    setOtherRow(otherRows);
    setCanShowMore(maxOptions.length > 4); // Update the state based on the condition
  }, [socialLoginsConfig, isDark]);

  const handleCustomLogin = async (authConnection: AUTH_CONNECTION_TYPE, loginHint: string) => {
    try {
      // const connectorConfig = socialLoginsConfig.loginMethods[authConnection];
      const handler = createPasswordlessHandler(authConnection, {
        loginHint,
        clientId: "BKZDJP0ouZP0PtfQYssMiezINbUwnIthw6ClTtTICvh0MCRgAxi5GJbHKH9cjM6xyWxe73c6c94ASCTxbGNLUt8",
        web3authClientId,
        network: web3authNetwork,
        uiConfig: socialLoginsConfig.uiConfig,
        authConnection,
      });

      let token = "";
      if (authConnection === AUTH_CONNECTION.SMS_PASSWORDLESS) {
        const res = await captchaRef.current?.execute({ async: true });
        if (!res) {
          throw new Error("Captcha token is required");
        }
        token = res.response;
      }

      const result = await handler.sendVerificationCode({ captchaToken: token });
      if (result?.success) {
        setAuthConnection(authConnection);
        setShowOtpFlow(true);
        setPasswordlessHandler(handler);
      }
    } catch (error) {
      log.error(error);
    } finally {
      setIsPasswordLessLoading(false);
    }
  };

  const handleFormSubmit = async (loginHint: string) => {
    setIsPasswordLessLoading(true);
    if (isEmailPasswordLessLoginVisible) {
      const isEmailValid = loginHint.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
      if (isEmailValid) {
        const connectorConfig = socialLoginsConfig.loginMethods[AUTH_CONNECTION.EMAIL_PASSWORDLESS];
        if (connectorConfig.isDefault) {
          return handleSocialLoginClick({
            connector: socialLoginsConfig.connector || "",
            loginParams: {
              authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
              authConnectionId: connectorConfig.authConnectionId,
              groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
              extraLoginOptions: connectorConfig.extraLoginOptions,
              login_hint: loginHint,
              name: "Email",
            },
          });
        } else {
          return handleCustomLogin(AUTH_CONNECTION.EMAIL_PASSWORDLESS, loginHint);
        }
      }
    }

    if (isSmsPasswordLessLoginVisible) {
      const countryCode = "";
      const number = loginHint.startsWith("+") ? loginHint : `${countryCode}${loginHint}`;
      const result = await validatePhoneNumber(number);
      if (result) {
        const connectorConfig = socialLoginsConfig.loginMethods[AUTH_CONNECTION.SMS_PASSWORDLESS];
        if (connectorConfig.isDefault) {
          return handleSocialLoginClick({
            connector: socialLoginsConfig.connector || "",
            loginParams: {
              authConnection: AUTH_CONNECTION.SMS_PASSWORDLESS,
              authConnectionId: connectorConfig.authConnectionId,
              groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
              extraLoginOptions: connectorConfig.extraLoginOptions,
              login_hint: typeof result === "string" ? result : number,
              name: "Mobile",
            },
          });
        } else {
          return handleCustomLogin(AUTH_CONNECTION.SMS_PASSWORDLESS, loginHint);
        }
      }
    }

    setIsValidInput(false);
    setIsPasswordLessLoading(false);
    return undefined;
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

  const handleOtpComplete = async (otp: string) => {
    setOtpLoading(true);

    try {
      const connectorConfig = socialLoginsConfig.loginMethods[authConnection];
      const result = await passwordlessHandler?.verifyCode(otp);
      if (result?.id_token) {
        return handleSocialLoginClick({
          connector: socialLoginsConfig.connector || "",
          loginParams: {
            authConnection: authConnection,
            authConnectionId: connectorConfig.authConnectionId,
            groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
            extraLoginOptions: { ...connectorConfig.extraLoginOptions, id_token: result.id_token },
            login_hint: passwordlessHandler.passwordlessParams.loginHint,
            name: passwordlessHandler.name,
          },
        });
      }
    } catch (error) {
      log.error(error);
    } finally {
      setOtpLoading(false);
    }
  };

  if (showOtpFlow) {
    return (
      <LoginOtp
        otpLoading={otpLoading}
        loginHint={passwordlessHandler?.passwordlessParams.loginHint}
        setShowOtpFlow={setShowOtpFlow}
        authConnection={authConnection}
        handleOtpComplete={handleOtpComplete}
      />
    );
  }

  const headerLogo = [DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT].includes(appLogo) ? "" : appLogo;

  const renderLoginOptions = () => {
    return (
      <>
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
            isPasswordLessLoading={isPasswordLessLoading}
            isModalVisible={isModalVisible}
            isPasswordLessCtaClicked={isPasswordLessCtaClicked}
            setIsPasswordLessCtaClicked={setIsPasswordLessCtaClicked}
            title={title}
            placeholder={placeholder}
            handleFormSubmit={handleFormSubmit}
            invalidInputErrorMessage={invalidInputErrorMessage}
            isValidInput={isValidInput}
            isDark={isDark}
          />
        )}

        {!expand && showExternalWalletButton && showPasswordLessInput && (
          <div className="w3a--flex w3a--w-full w3a--items-center w3a--gap-x-2">
            <div className="w3a--h-px w3a--w-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-500" />
            <p className="w3a--text-xs w3a--font-normal w3a--uppercase w3a--text-app-gray-400 dark:w3a--text-app-gray-400">or</p>
            <div className="w3a--h-px w3a--w-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-500" />
          </div>
        )}

        {!expand && showExternalWalletButton && (
          <button type="button" className={cn("w3a--btn !w3a--justify-between w3a-external-wallet-btn")} onClick={handleConnectWallet}>
            <p className="w3a--text-app-gray-900 dark:w3a--text-app-white">{t("modal.external.connect")}</p>
            <div
              id="external-wallet-count"
              className="w3a--w-auto w3a--rounded-full w3a--bg-app-primary-100 w3a--px-2.5 w3a--py-0.5 w3a--text-xs w3a--font-medium w3a--text-app-primary-800 dark:w3a--border dark:w3a--border-app-primary-500 dark:w3a--bg-transparent dark:w3a--text-app-primary-500"
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
      </>
    );
  };

  return (
    <div className="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-4 w3a--p-4">
      <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2 w3a--pt-10">
        <figure className="w3a--mx-auto w3a--flex w3a--h-12 w3a--w-[200px] w3a--items-center w3a--justify-center">
          {headerLogo ? (
            <img src={headerLogo} alt="Logo" className="w3a--object-contain" />
          ) : (
            <img src={getIcons(isDark ? "dark-logo" : "light-logo")} alt="Logo" className="w3a--object-contain" />
          )}
        </figure>
        <p className="w3a--text-lg w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">{t("modal.social.sign-in")}</p>
      </div>

      <HCaptcha
        ref={captchaRef}
        sitekey={CAPTCHA_SITE_KEY}
        size="invisible"
        languageOverride={socialLoginsConfig.uiConfig.defaultLanguage}
        theme={socialLoginsConfig.uiConfig.theme}
        onOpen={() => setShowCaptcha(true)}
        onClose={() => setShowCaptcha(false)}
        onError={() => setCaptchaError("passwordless.captcha-default-error")}
        onChalExpired={() => setCaptchaError("passwordless.captcha-default-error")}
      />

      {captchaError && showCaptcha && (
        <p className="-w3a--mt-2 w3a--w-full w3a--pl-6 w3a--text-start w3a--text-xs w3a--font-normal w3a--text-app-red-500 dark:w3a--text-app-red-400">
          {t(captchaError)}
        </p>
      )}

      {!showCaptcha && renderLoginOptions()}
    </div>
  );
}

export default Login;
