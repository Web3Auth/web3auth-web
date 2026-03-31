import HCaptcha from "@hcaptcha/react-hcaptcha";
import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import { ANALYTICS_EVENTS, log, type ModalSignInMethodType, WALLET_CONNECTORS, WalletLoginError } from "@web3auth/no-modal";
import { MouseEvent as ReactMouseEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import Image from "../../components/Image";
import SocialLoginList from "../../components/SocialLoginList/SocialLoginList";
import { capitalizeFirstLetter, CAPTCHA_SITE_KEY } from "../../config";
import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT, PAGES } from "../../constants";
import { AnalyticsContext } from "../../context/AnalyticsContext";
import { useModalState } from "../../context/ModalStateContext";
import { useBodyState } from "../../context/RootContext";
import { useWidget } from "../../context/WidgetContext";
import type { PasswordlessHandler } from "../../handlers/AbstractHandler";
import { createPasswordlessHandler } from "../../handlers/factory";
import { isTestAccountPattern } from "../../helper/testAccounts";
import type { ExternalButton, rowType } from "../../interfaces";
import i18n from "../../localeImport";
import { cn, getIcons, getUserCountry, validatePhoneNumber } from "../../utils";
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
  const { installedExternalWalletConfig, totalExternalWallets, remainingUndisplayedWallets } = props;

  const [t] = useTranslation(undefined, { i18n });
  const { bodyState, setBodyState } = useBodyState();
  const { analytics } = useContext(AnalyticsContext);
  const { appLogo, deviceDetails, uiConfig, isDark } = useWidget();
  // TODO: add appName, isEmailPrimary, isExternalPrimary
  const {
    modalState,
    setModalState,
    areSocialLoginsVisible,
    isEmailPasswordLessLoginVisible,
    isSmsPasswordLessLoginVisible,
    showPasswordLessInput,
    showExternalWalletButton,
    handleShowExternalWallets,
    preHandleSocialLoginClick: handleSocialLoginClick,
    preHandleExternalWalletClick: handleExternalWalletClick,
  } = useModalState();
  const { modalVisibility: isModalVisible, socialLoginsConfig } = modalState;
  const {
    buttonRadiusType: buttonRadius,
    logoAlignment,
    displayInstalledExternalWallets: showInstalledExternalWallets,
    displayExternalWalletsCount: showExternalWalletCount,
    web3authClientId,
    web3authNetwork,
    authBuildEnv,
  } = uiConfig;

  const [countryCode, setCountryCode] = useState<string>("");
  const [countryFlag, setCountryFlag] = useState<string>("");
  const [passwordlessErrorMessage, setPasswordlessErrorMessage] = useState<string>("");
  const [otpErrorMessage, setOtpErrorMessage] = useState<string>("");
  const [expandSocialLogins, setExpandSocialLogins] = useState(false);
  const [canShowMore, setCanShowMore] = useState(false);
  const [visibleRow, setVisibleRow] = useState<rowType[]>([]);
  const [otherRow, setOtherRow] = useState<rowType[]>([]);
  const [mainOptionsRow, setMainOptionsRow] = useState<rowType[]>([]);
  const [isPasswordLessCtaClicked, setIsPasswordLessCtaClicked] = useState(false);
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [authConnection, setAuthConnection] = useState<AUTH_CONNECTION_TYPE | undefined>(undefined);
  const [passwordlessHandler, setPasswordlessHandler] = useState<PasswordlessHandler | undefined>(undefined);
  const [isPasswordLessLoading, setIsPasswordLessLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState<string>("");
  const captchaRef = useRef<HCaptcha>(null);

  const handleSocialLoginExpand = () => {
    setExpandSocialLogins((prev) => !prev);
    setIsPasswordLessCtaClicked(false);
  };

  useEffect(() => {
    const maxOptions = Object.keys(socialLoginsConfig.loginMethods).filter((loginMethodKey) => {
      return socialLoginsConfig.loginMethods[loginMethodKey as AUTH_CONNECTION_TYPE].showOnModal && !restrictedLoginMethods.includes(loginMethodKey);
    });

    const visibleRows: rowType[] = [];
    const otherRows: rowType[] = [];
    const mainOptionsRows: rowType[] = [];

    const loginMethodsOrder = (socialLoginsConfig.loginMethodsOrder || []).reduce(
      (acc, method, index) => {
        acc[method] = index;
        return acc;
      },
      {} as Record<string, number>
    );

    const loginOptions = Object.keys(socialLoginsConfig.loginMethods)
      .filter((method) => {
        return !socialLoginsConfig.loginMethods[method as AUTH_CONNECTION_TYPE].showOnModal === false && !restrictedLoginMethods.includes(method);
      })
      .sort((a, b) => {
        const maxOrder = (socialLoginsConfig.loginMethodsOrder || []).length;
        const aOrder = loginMethodsOrder[a] ?? maxOrder;
        const bOrder = loginMethodsOrder[b] ?? maxOrder;

        const { mainOption: aMainOption } = socialLoginsConfig.loginMethods[a as AUTH_CONNECTION_TYPE] || {};
        const { mainOption: bMainOption } = socialLoginsConfig.loginMethods[b as AUTH_CONNECTION_TYPE] || {};

        // if both are main options, sort by order
        if (aMainOption && bMainOption) {
          return aOrder - bOrder;
        }

        // if one is main option, it should be first
        if (aMainOption) return -1;
        if (bMainOption) return 1;

        // if none are main options, sort by order
        return aOrder - bOrder;
      });

    loginOptions.forEach((method, index) => {
      const connectorConfig = socialLoginsConfig.loginMethods[method as AUTH_CONNECTION_TYPE];
      const name = capitalizeFirstLetter(connectorConfig.name || method);
      const order = index + 1;

      const isPrimaryBtn = socialLoginsConfig?.uiConfig?.primaryButton === "socialLogin" && order === 1;
      const isMainOption = connectorConfig.mainOption;

      const loginOptionLength = loginOptions.length;
      const moreThanFour = loginOptionLength >= 4;

      const lengthCheck = moreThanFour ? order > 0 && order <= loginOptionLength : order > 0 && order < 4;

      const rows = {
        description: connectorConfig.description || "",
        method,
        isDark,
        isPrimaryBtn,
        name: name === "Twitter" ? "X" : name,
        loginParams: {
          authConnection: connectorConfig.authConnection || (method as AUTH_CONNECTION_TYPE),
          authConnectionId: connectorConfig.authConnectionId,
          groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
          extraLoginOptions: connectorConfig.extraLoginOptions,
          name,
          login_hint: "",
        },
        order,
      };

      if (isMainOption) {
        mainOptionsRows.push(rows);
      } else if (lengthCheck) {
        visibleRows.push(rows);
      }

      otherRows.push(rows);
    });

    setVisibleRow(visibleRows);
    setOtherRow(otherRows);
    setMainOptionsRow(mainOptionsRows);
    setCanShowMore(maxOptions.length > 4); // Update the state based on the condition
  }, [socialLoginsConfig, isDark, buttonRadius]);

  const handleCustomLogin = async (authConnection: AUTH_CONNECTION_TYPE, loginHint: string) => {
    try {
      const handler = createPasswordlessHandler(authConnection, {
        loginHint,
        web3authClientId,
        network: web3authNetwork,
        uiConfig: socialLoginsConfig.uiConfig,
        authConnection,
        authBuildEnv,
      });

      let token: string | undefined = undefined;
      if (!isTestAccountPattern(authConnection, loginHint)) {
        const res = await captchaRef.current?.execute({ async: true });
        if (!res) {
          throw WalletLoginError.connectionError("Captcha token is required");
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
            loginParams: {
              authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
              authConnectionId: connectorConfig.authConnectionId,
              groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
              extraLoginOptions: connectorConfig.extraLoginOptions,
              loginHint: loginHint,
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
      if (result.success) {
        const finalLoginHint = typeof result.parsed_number === "string" ? result.parsed_number : number;
        const connectorConfig = socialLoginsConfig.loginMethods[AUTH_CONNECTION.SMS_PASSWORDLESS];
        if (connectorConfig.isDefault) {
          return handleSocialLoginClick({
            loginParams: {
              authConnection: AUTH_CONNECTION.SMS_PASSWORDLESS,
              authConnectionId: connectorConfig.authConnectionId,
              groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
              extraLoginOptions: connectorConfig.extraLoginOptions,
              loginHint: finalLoginHint,
              name: "Mobile",
            },
          });
        } else {
          setCountryFlag(result.country_flag);
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
          loginParams: {
            authConnection: authConnection,
            authConnectionId: connectorConfig.authConnectionId,
            groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
            extraLoginOptions: { ...connectorConfig.extraLoginOptions, id_token: result.data?.id_token },
            loginHint: passwordlessHandler.passwordlessParams.loginHint,
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

  const handleExternalWalletBtnClick = useCallback(
    (flag: boolean) => {
      setModalState({
        ...modalState,
        currentPage: PAGES.WALLET_LIST,
      });

      handleShowExternalWallets(flag);
    },
    [modalState, setModalState, handleShowExternalWallets]
  );

  /**
   * Installed wallet click logic:
   * - For MetaMask: If not injected and on desktop, display QR code for connection.
   * - If wallet supports multiple chain namespaces, prompt user to select a chain.
   * - Otherwise, connect directly using the wallet connector.
   */
  const handleInstalledWalletClick = (wallet: ExternalButton) => {
    analytics?.track(ANALYTICS_EVENTS.EXTERNAL_WALLET_SELECTED, {
      connector: wallet.name,
      wallet_name: wallet.displayName,
      is_installed: wallet.isInstalled,
      is_injected: wallet.hasInjectedWallet,
      chain_namespaces: wallet.chainNamespaces,
      has_wallet_connect: wallet.hasWalletConnect,
      has_install_links: wallet.hasInstallLinks,
      has_wallet_registry_item: !!wallet.walletRegistryItem,
      total_external_wallets: totalExternalWallets,
    });
    log.info("handleInstalledWalletClick", wallet);

    // for non-injected MetaMask on desktop, navigate to ConnectWallet page with pre-selected wallet
    if (wallet.name === WALLET_CONNECTORS.METAMASK && !wallet.hasInjectedWallet && deviceDetails.platform === "desktop") {
      handleExternalWalletClick({ connector: wallet.name });
      // Set pre-selected wallet and navigate to ConnectWallet page
      setBodyState({
        ...bodyState,
        preSelectedWallet: wallet,
      });

      handleExternalWalletBtnClick(true);

      return;
    }

    // when having multiple namespaces, ask user to select one
    if (wallet.chainNamespaces?.length > 1) {
      setBodyState({
        ...bodyState,
        multiChainSelector: {
          show: true,
          wallet: wallet,
        },
      });
    } else {
      handleExternalWalletClick({ connector: wallet.name });
    }
  };

  const installedExternalWallets = useMemo(() => {
    if (showInstalledExternalWallets) return installedExternalWalletConfig;
    // always show MetaMask
    return installedExternalWalletConfig.filter((wallet) => wallet.name === WALLET_CONNECTORS.METAMASK);
  }, [installedExternalWalletConfig, showInstalledExternalWallets]);

  const handleConnectWallet = useCallback(
    (e?: ReactMouseEvent<HTMLButtonElement>) => {
      analytics?.track(ANALYTICS_EVENTS.EXTERNAL_WALLET_LIST_EXPANDED, {
        total_external_wallets: totalExternalWallets,
        installed_external_wallets: installedExternalWallets.length,
      });
      setIsPasswordLessCtaClicked(false);
      e?.preventDefault();
      handleExternalWalletBtnClick(true);
    },
    [analytics, handleExternalWalletBtnClick, installedExternalWallets.length, totalExternalWallets]
  );

  useEffect(() => {
    if (showExternalWalletButton && !areSocialLoginsVisible && !showPasswordLessInput) {
      handleConnectWallet();
    }
  }, [showExternalWalletButton, areSocialLoginsVisible, showPasswordLessInput, handleConnectWallet]);

  if (showOtpFlow) {
    return (
      <LoginOtp
        otpLoading={otpLoading}
        loginHint={passwordlessHandler?.passwordlessParams.loginHint}
        setShowOtpFlow={setShowOtpFlow}
        authConnection={authConnection}
        handleOtpComplete={handleOtpComplete}
        errorMessage={otpErrorMessage}
        countryFlag={countryFlag}
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
        mainOptionsRow={mainOptionsRow}
        handleSocialLoginClick={handleSocialLoginClick}
        socialLoginsConfig={socialLoginsConfig}
        handleExpandSocialLogins={handleSocialLoginExpand}
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
              className={cn("w3a--btn !w3a--justify-between w3a--group w3a--relative w3a--overflow-hidden", {
                "w3a--rounded-full": buttonRadius === "pill",
                "w3a--rounded-lg": buttonRadius === "rounded",
                "w3a--rounded-none": buttonRadius === "square",
              })}
              onClick={() => handleInstalledWalletClick(wallet)}
            >
              <p className="w3a--max-w-[180px] w3a--truncate w3a--text-base w3a--font-normal w3a--text-app-gray-700 dark:w3a--text-app-white">
                {wallet.displayName}
              </p>
              <div className="w3a--absolute w3a--right-4 w3a--top-1/2 w3a--flex w3a--w-auto -w3a--translate-y-1/2 w3a--items-center w3a--gap-x-2 w3a--transition-all w3a--duration-300 group-hover:w3a--translate-x-6 group-hover:w3a--opacity-0">
                {wallet.hasInjectedWallet && (
                  <span
                    className="w3a--inline-flex w3a--items-center w3a--rounded-md w3a--bg-app-primary-100 w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--text-app-primary-800 
                  dark:w3a--border dark:w3a--border-app-primary-400 dark:w3a--bg-transparent dark:w3a--text-app-primary-400"
                  >
                    {t("modal.external.installed")}
                  </span>
                )}
                <figure className="w3a--size-5">
                  <Image
                    imageData={wallet.icon}
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
              <img
                id="injected-wallet-arrow"
                className="w3a--absolute w3a--right-4 w3a--top-1/2 -w3a--translate-x-10 -w3a--translate-y-1/2 w3a--opacity-0 w3a--transition-all w3a--duration-300
          group-hover:w3a--translate-x-0 group-hover:w3a--opacity-100"
                src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
                alt="arrow"
              />
            </button>
          ))}

        {/* EXTERNAL WALLETS DISCOVERY */}
        {remainingUndisplayedWallets > 0 && (
          <button
            type="button"
            className={cn("w3a--btn !w3a--justify-between w3a--group w3a--relative w3a--overflow-hidden", {
              "w3a--rounded-full": buttonRadius === "pill",
              "w3a--rounded-lg": buttonRadius === "rounded",
              "w3a--rounded-none": buttonRadius === "square",
            })}
            onClick={handleConnectWallet}
          >
            <p className="w3a--text-base w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">{t("modal.external.all-wallets")}</p>
            {showExternalWalletCount && (
              <div
                id="external-wallet-count"
                className="w3a--absolute w3a--right-4 w3a--top-1/2 w3a--w-auto -w3a--translate-y-1/2 w3a--rounded-full w3a--bg-app-primary-100 w3a--px-2.5 w3a--py-0.5 w3a--text-xs w3a--font-medium w3a--text-app-primary-800 w3a--transition-all w3a--delay-300 w3a--duration-300 group-hover:w3a--translate-x-6 group-hover:w3a--opacity-0 group-hover:w3a--delay-0 dark:w3a--border dark:w3a--border-app-primary-500 dark:w3a--bg-transparent dark:w3a--text-app-primary-500"
              >
                {remainingUndisplayedWallets}
              </div>
            )}
            <img
              id="external-wallet-arrow"
              className="w3a--absolute w3a--right-4 w3a--top-1/2 -w3a--translate-x-10 -w3a--translate-y-1/2 w3a--opacity-0 w3a--transition-all w3a--duration-300
          group-hover:w3a--translate-x-0 group-hover:w3a--opacity-100"
              src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
              alt="arrow"
            />
          </button>
        )}
      </div>
    );
  };

  const headerLogo = [DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT].includes(appLogo) ? "" : appLogo;

  const delimiter = (index: number) => {
    return (
      <div
        className={cn("w3a--flex w3a--w-full w3a--items-center w3a--gap-x-2", headerLogo ? "w3a--my-2" : "w3a--my-4")}
        key={`section-delimiter-${index}`}
      >
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

  const socialLoginExpandedView = () => socialLoginSection(otherRow);

  return (
    <div className="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-4 w3a--p-2">
      <div
        className={cn(
          "w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2 w3a--pt-6",
          logoAlignment === "center" ? "" : "w3a--w-full"
        )}
      >
        {headerLogo && (
          <figure
            className={cn(
              "w3a--mx-auto w3a--h-12 w3a--w-[200px]",
              logoAlignment === "center" ? "w3a--flex w3a--justify-center w3a--items-center" : "w3a--ml-0 w3a--w-auto"
            )}
          >
            <img src={headerLogo} alt="Logo" className="w3a--size-full w3a--object-contain" />
          </figure>
        )}
        <p
          className={cn(
            "w3a--text-app-gray-900 dark:w3a--text-app-white",
            logoAlignment === "center" ? "w3a--text-center" : "w3a--text-left w3a--w-full w3a--ml-4",
            headerLogo ? "w3a--text-lg w3a--font-semibold" : "w3a--text-3xl w3a--font-medium"
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
          {!expandSocialLogins && defaultView()}

          {/* EXPANDED VIEW */}
          {expandSocialLogins && socialLoginExpandedView()}
        </div>
      )}
    </div>
  );
}

export default Login;
