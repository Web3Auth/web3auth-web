import { AUTH_CONNECTION, type AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import { type ModalSignInMethodType, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { capitalizeFirstLetter } from "../../config";
import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT, type rowType } from "../../interfaces";
import i18n from "../../localeImport";
import { cn, getIcons, validatePhoneNumber } from "../../utils";
import Image from "../Image";
import SocialLoginList from "../SocialLoginList/SocialLoginList";
import { LoginProps } from "./Login.type";
import LoginOtp from "./LoginOtp";
import LoginPasswordLess from "./LoginPasswordLess";

export const restrictedLoginMethods: string[] = [
  AUTH_CONNECTION.SMS_PASSWORDLESS,
  AUTH_CONNECTION.EMAIL_PASSWORDLESS,
  AUTH_CONNECTION.AUTHENTICATOR,
  AUTH_CONNECTION.PASSKEYS,
  AUTH_CONNECTION.TELEGRAM,
  AUTH_CONNECTION.CUSTOM,
];

function Login(props: LoginProps) {
  const {
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
    handleInstalledExternalWalletClick,
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
      return socialLoginsConfig.loginMethods[loginMethodKey as AUTH_CONNECTION_TYPE].showOnModal;
    });

    const visibleRows: rowType[] = [];
    const otherRows: rowType[] = [];

    const loginOptions = Object.keys(socialLoginsConfig.loginMethods).filter((method) => {
      return !socialLoginsConfig.loginMethods[method as AUTH_CONNECTION_TYPE].showOnModal === false && !restrictedLoginMethods.includes(method);
    });

    // eslint-disable-next-line no-console
    console.log("loginOptions", loginOptions);

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
      // eslint-disable-next-line no-console
      console.log("lengthCheck", lengthCheck, moreThanFour, loginOptionLength, method, order);
      if (lengthCheck) {
        visibleRows.push({
          method,
          isDark,
          isPrimaryBtn,
          name,
          adapter: socialLoginsConfig.connector,
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
      }

      otherRows.push({
        method,
        isDark,
        isPrimaryBtn,
        name: name === "Twitter" ? "X" : name,
        adapter: socialLoginsConfig.connector,
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
        const connectorConfig = socialLoginsConfig.loginMethods[AUTH_CONNECTION.EMAIL_PASSWORDLESS];
        return handleSocialLoginClick({
          connector: socialLoginsConfig.connector || "",
          loginParams: {
            authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
            authConnectionId: connectorConfig.authConnectionId,
            groupedAuthConnectionId: connectorConfig.groupedAuthConnectionId,
            extraLoginOptions: connectorConfig.extraLoginOptions,
            login_hint: value,
            name: "Email",
          },
        });
      }
    }
    if (isSmsPasswordLessLoginVisible) {
      const countryCode = "";
      const number = value.startsWith("+") ? value : `${countryCode}${value}`;
      const result = await validatePhoneNumber(number);
      if (result) {
        const connectorConfig = socialLoginsConfig.loginMethods[AUTH_CONNECTION.SMS_PASSWORDLESS];
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

  const installedExternalWallets = useMemo(() => {
    if (showInstalledExternalWallets) return installedExternalWalletConfig;
    // always show MetaMask
    return installedExternalWalletConfig.filter((wallet) => wallet.name === WALLET_CONNECTORS.METAMASK);
  }, [installedExternalWalletConfig, showInstalledExternalWallets]);

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
        fieldValue={fieldValue}
        handleInputChange={handleInputChange}
        placeholder={placeholder}
        handleFormSubmit={handleFormSubmit}
        invalidInputErrorMessage={invalidInputErrorMessage}
        isValidInput={isValidInput}
        isDark={isDark}
        buttonRadius={buttonRadius}
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
              onClick={() => handleInstalledExternalWalletClick({ connector: wallet.name })}
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
            {showExternalWalletCount && (
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

  const headerLogo = [DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT].includes(appLogo) ? "" : appLogo;

  return (
    <div className="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-8 w3a--p-4">
      <div
        className={cn(
          "w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2 w3a--pt-10",
          logoAlignment === "center" ? "" : "w3a--w-full"
        )}
      >
        <figure className={cn("w3a--mx-auto w3a--h-12 w3a--w-[200px]", logoAlignment === "center" ? "" : "w3a--ml-0")}>
          {headerLogo ? (
            <img src={headerLogo} alt="Logo" className="w3a--object-contain" />
          ) : (
            <img src={getIcons(isDark ? "dark-logo" : "light-logo")} alt="Logo" className="w3a--object-contain" />
          )}
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

      <div className="w3a--flex w3a--w-full w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2">
        {/* DEFAULT VIEW */}
        {!expand && defaultView()}

        {/* EXPANDED VIEW */}
        {expand && socialLoginSection(otherRow)}
      </div>
    </div>
  );
}

export default Login;
