import HCaptcha from "@hcaptcha/react-hcaptcha";
import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import { log, type ModalSignInMethodType, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// import LogoDark from "../../assets/logo-dark.svg";
// import LogoLight from "../../assets/logo-light.svg";
import { capitalizeFirstLetter, CAPTCHA_SITE_KEY } from "../../config";
import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT } from "../../constants";
import { PasswordlessHandler } from "../../handlers/AbstractHandler";
import { createPasswordlessHandler } from "../../handlers/factory";
import type { rowType } from "../../interfaces";
import i18n from "../../localeImport";
import { cn, getIcons, getUserCountry, validatePhoneNumber } from "../../utils";
import Image from "../Image";
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
  // TODO: add appName, isEmailPrimary, isExternalPrimary
  const {
    // appName,
    web3authClientId,
    web3authNetwork,
    appLogo,
    isModalVisible,
    handleSocialLoginHeight,
    socialLoginsConfig,
    installedExternalWalletConfig,
    isDark,
    handleSocialLoginClick,
    totalExternalWallets,
    isEmailPasswordLessLoginVisible,
    isSmsPasswordLessLoginVisible,
    handleExternalWalletBtnClick,
    handleExternalWalletClick,
    areSocialLoginsVisible,
    showPasswordLessInput,
    showExternalWalletButton,
    showExternalWalletCount,
    showInstalledExternalWallets,
    logoAlignment = "center",
    buttonRadius = "pill",
    enableMainSocialLoginButton = false,
  } = props;

  const [t] = useTranslation(undefined, { i18n });

  const [countryCode, setCountryCode] = useState<string>("");
  const [passwordlessErrorMessage, setPasswordlessErrorMessage] = useState<string>("");
  const [otpErrorMessage, setOtpErrorMessage] = useState<string>("");
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

    const loginOptions = Object.keys(socialLoginsConfig.loginMethods).filter((method) => {
      return !socialLoginsConfig.loginMethods[method as AUTH_CONNECTION_TYPE].showOnModal === false && !restrictedLoginMethods.includes(method);
    });

    loginOptions.forEach((method, index) => {
      const connectorConfig = socialLoginsConfig.loginMethods[method as AUTH_CONNECTION_TYPE];
      const name = capitalizeFirstLetter(connectorConfig.name || method);
      // const orderIndex = socialLoginsConfig.loginMethodsOrder.indexOf(method) + 1;
      const order = index + 1;

      const isMainOption = order === 1 && enableMainSocialLoginButton;
      const isPrimaryBtn = socialLoginsConfig?.uiConfig?.primaryButton === "socialLogin" && order === 1;

      const loginOptionLength = loginOptions.length;
      const moreThanFour = loginOptionLength >= 4;

      const lengthCheck = moreThanFour ? order > 0 && order <= loginOptionLength : order > 0 && order < 4;

      if (lengthCheck) {
        visibleRows.push({
          method,
          isDark,
          isPrimaryBtn,
          name,
          connector: socialLoginsConfig.connector,
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
        connector: socialLoginsConfig.connector,
        loginParams: {
          authConnection: method as AUTH_CONNECTION_TYPE,
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
  }, [socialLoginsConfig, isDark, enableMainSocialLoginButton, buttonRadius]);

  const handleCustomLogin = async (authConnection: AUTH_CONNECTION_TYPE, loginHint: string) => {
    try {
      const handler = createPasswordlessHandler(authConnection, {
        loginHint,
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
      if (result?.error) {
        setPasswordlessErrorMessage(t(result.error));
        return;
      }

      setAuthConnection(authConnection);
      setShowOtpFlow(true);
      setPasswordlessHandler(handler);
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
      const number = loginHint.startsWith("+") ? loginHint : `${countryCode}${loginHint}`;
      const result = await validatePhoneNumber(number);
      if (result) {
        const finalLoginHint = typeof result === "string" ? result : number;
        const connectorConfig = socialLoginsConfig.loginMethods[AUTH_CONNECTION.SMS_PASSWORDLESS];
        if (connectorConfig.isDefault) {
          return handleSocialLoginClick({
            connector: socialLoginsConfig.connector || "",
            loginParams: {
              authConnection: AUTH_CONNECTION.SMS_PASSWORDLESS,
              authConnectionId: connectorConfig.authConnectionId,
              groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
              extraLoginOptions: connectorConfig.extraLoginOptions,
              login_hint: finalLoginHint,
              name: "Mobile",
            },
          });
        } else {
          return handleCustomLogin(AUTH_CONNECTION.SMS_PASSWORDLESS, finalLoginHint);
        }
      }
    }

    setPasswordlessErrorMessage(invalidInputErrorMessage);
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

  useEffect(() => {
    const getLocation = async () => {
      const result = await getUserCountry();
      if (result && result.dialCode) {
        setCountryCode(result.dialCode);
      }
    };
    if (isSmsPasswordLessLoginVisible) getLocation();
  }, [isSmsPasswordLessLoginVisible]);

  const handleConnectWallet = (e: ReactMouseEvent<HTMLButtonElement>) => {
    setIsPasswordLessCtaClicked(false);
    e.preventDefault();
    if (handleExternalWalletBtnClick) handleExternalWalletBtnClick(true);
  };

  const handleOtpComplete = async (otp: string) => {
    setOtpLoading(true);
    if (otpErrorMessage) setOtpErrorMessage("");

    try {
      const connectorConfig = socialLoginsConfig.loginMethods[authConnection];
      const result = await passwordlessHandler?.verifyCode(otp);
      if (result?.error) {
        setOtpErrorMessage(t(result.error));
        return;
      }

      if (result?.data?.id_token) {
        return handleSocialLoginClick({
          connector: socialLoginsConfig.connector || "",
          loginParams: {
            authConnection: authConnection,
            authConnectionId: connectorConfig.authConnectionId,
            groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
            extraLoginOptions: { ...connectorConfig.extraLoginOptions, id_token: result.data?.id_token },
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

  const installedExternalWallets = useMemo(() => {
    if (showInstalledExternalWallets) return installedExternalWalletConfig;
    // always show MetaMask
    return installedExternalWalletConfig.filter((wallet) => wallet.name === WALLET_CONNECTORS.METAMASK);
  }, [installedExternalWalletConfig, showInstalledExternalWallets]);

  if (showOtpFlow) {
    return (
      <LoginOtp
        otpLoading={otpLoading}
        loginHint={passwordlessHandler?.passwordlessParams.loginHint}
        setShowOtpFlow={setShowOtpFlow}
        authConnection={authConnection}
        handleOtpComplete={handleOtpComplete}
        errorMessage={otpErrorMessage}
      />
    );
  }

  const socialLoginSection = (otherRow: rowType[] = []) => {
    return (
      <SocialLoginList
        key="social-login-section"
        otherRow={otherRow}
        isDark={isDark}
        visibleRow={visibleRow}
        canShowMore={canShowMore}
        handleSocialLoginClick={handleSocialLoginClick}
        socialLoginsConfig={socialLoginsConfig}
        handleExpandSocialLogins={handleExpand}
        buttonRadius={buttonRadius}
      />
    );
  };

  const passwordlessLoginSection = () => {
    return (
      <LoginPasswordLess
        key="passwordless-section"
        isModalVisible={isModalVisible}
        isPasswordLessCtaClicked={isPasswordLessCtaClicked}
        setIsPasswordLessCtaClicked={setIsPasswordLessCtaClicked}
        title={title}
        placeholder={placeholder}
        handleFormSubmit={handleFormSubmit}
        errorMessage={passwordlessErrorMessage}
        isDark={isDark}
        buttonRadius={buttonRadius}
        isPasswordLessLoading={isPasswordLessLoading}
      />
    );
  };

  const externalWalletSection = () => {
    return (
      <div key="external-wallets-section" className={cn("w3a--flex w3a--w-full w3a--flex-col w3a--items-start w3a--justify-start w3a--gap-y-2")}>
        {/* INSTALLED EXTERNAL WALLETS */}
        {installedExternalWallets.length > 0 &&
          installedExternalWallets.map((wallet) => (
            <button
              key={wallet.name}
              type="button"
              className={cn("w3a--btn !w3a--justify-between w3a-external-wallet-btn", {
                "w3a--rounded-full": buttonRadius === "pill",
                "w3a--rounded-lg": buttonRadius === "rounded",
                "w3a--rounded-none": buttonRadius === "square",
              })}
              onClick={() => handleExternalWalletClick({ connector: wallet.name })}
            >
              <p className="w3a--text-base w3a--font-normal w3a--text-app-gray-700 dark:w3a--text-app-white">{wallet.displayName}</p>
              <div className="w3a--flex w3a--items-center w3a--gap-x-2">
                <figure className="w3a--size-5 w3a--rounded-full w3a--bg-app-gray-300">
                  <Image
                    imageId={`login-${wallet.name}`}
                    hoverImageId={`login-${wallet.name}`}
                    fallbackImageId="wallet"
                    height="24"
                    width="24"
                    isButton
                    extension={wallet.imgExtension || "webp"}
                  />
                </figure>
              </div>
            </button>
          ))}

        {/* EXTERNAL WALLETS DISCOVERY */}
        {
          <button
            type="button"
            className={cn("w3a--btn !w3a--justify-between w3a-external-wallet-btn", {
              "w3a--rounded-full": buttonRadius === "pill",
              "w3a--rounded-lg": buttonRadius === "rounded",
              "w3a--rounded-none": buttonRadius === "square",
            })}
            onClick={handleConnectWallet}
          >
            <p className="w3a--text-app-gray-900 dark:w3a--text-app-white">{t("modal.external.all-wallets")}</p>
            {showExternalWalletCount && totalExternalWallets > 0 && (
              <div
                id="external-wallet-count"
                className="w3a--w-auto w3a--rounded-full w3a--bg-app-primary-100 w3a--px-2.5 w3a--py-0.5 w3a--text-xs w3a--font-medium w3a--text-app-primary-800 dark:w3a--border dark:w3a--border-app-primary-500 dark:w3a--bg-transparent dark:w3a--text-app-primary-500"
              >
                {totalExternalWallets - 1}+
              </div>
            )}
            <img
              id="external-wallet-arrow"
              className="w3a--icon-animation"
              src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
              alt="arrow"
            />
          </button>
        }
      </div>
    );
  };

  const delimiter = (index: number) => {
    return (
      <div className="w3a--flex w3a--w-full w3a--items-center w3a--gap-x-2" key={`section-delimiter-${index}`}>
        <div className="w3a--h-px w3a--w-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-500" />
        <p className="w3a--text-xs w3a--font-normal w3a--uppercase w3a--text-app-gray-400 dark:w3a--text-app-gray-400">or</p>
        <div className="w3a--h-px w3a--w-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-500" />
      </div>
    );
  };

  const defaultView = () => {
    const sectionMap = {
      social: socialLoginSection,
      passwordless: passwordlessLoginSection,
      externalWallets: externalWalletSection,
    };
    const sectionVisibility = {
      social: areSocialLoginsVisible,
      passwordless: showPasswordLessInput,
      externalWallets: showExternalWalletButton,
    } as Record<ModalSignInMethodType, boolean>;
    const signInMethods = socialLoginsConfig.uiConfig?.signInMethods || ["social", "passwordless", "externalWallets"];

    // add missing signInMethods in case uiConfig.signInMethods is not set correctly
    Object.entries(sectionVisibility).forEach(([method, visibility]) => {
      if (visibility && !signInMethods.includes(method as ModalSignInMethodType)) {
        signInMethods.push(method as ModalSignInMethodType);
      }
    });
    const sections = signInMethods.map((method) => sectionVisibility[method] && sectionMap[method]()).filter(Boolean);

    // add delimiter between external wallets and other sections
    if (sections.length === 3) {
      const externalWalletIndex = signInMethods.findIndex((section) => section === "externalWallets");
      if (externalWalletIndex === 0) {
        // add after it
        sections.splice(1, 0, delimiter(1));
      } else if (externalWalletIndex === 1) {
        // add before it
        sections.splice(1, 0, delimiter(1));
        // add after it
        sections.splice(3, 0, delimiter(2));
      } else if (externalWalletIndex === 2) {
        // add before it
        sections.splice(2, 0, delimiter(1));
      }
    } else if (sections.length === 2) {
      if (sectionVisibility["externalWallets"]) {
        sections.splice(1, 0, delimiter(1));
      }
    }

    return sections;
  };

  const expandedView = () => socialLoginSection(otherRow);

  const headerLogo = [DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT].includes(appLogo) ? "" : appLogo;

  return (
    <div className="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-4 w3a--p-2">
      <div
        className={cn(
          "w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2 w3a--pt-6",
          logoAlignment === "center" ? "" : "w3a--w-full"
        )}
      >
        <figure
          className={cn(
            "w3a--mx-auto w3a--h-12 w3a--w-[200px]",
            logoAlignment === "center" ? "w3a--flex w3a--justify-center w3a--items-center" : "w3a--ml-0"
          )}
        >
          <img src={headerLogo || getIcons(isDark ? "dark-logo" : "light-logo")} alt="Logo" className="w3a--object-contain" />
        </figure>
        <p
          className={cn(
            "w3a--text-lg w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white",
            logoAlignment === "center" ? "w3a--text-center" : "w3a--text-left w3a--w-full w3a--ml-4"
          )}
        >
          {t("modal.social.sign-in")}
        </p>
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

      {!showCaptcha && (
        <div className="w3a--flex w3a--w-full w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2">
          {/* DEFAULT VIEW */}
          {!expand && defaultView()}

          {/* EXPANDED VIEW */}
          {expand && expandedView()}
        </div>
      )}
    </div>
  );
}

export default Login;
