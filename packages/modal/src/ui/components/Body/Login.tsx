import { LOGIN_PROVIDER } from "@web3auth/auth";
import { createEffect, createMemo, createSignal, Match, mergeProps, Show, Suspense, Switch } from "solid-js";

import { capitalizeFirstLetter } from "../../config";
import { SocialLoginsConfig } from "../../interfaces";
import { t } from "../../localeImport";
import { cn, getIcons } from "../../utils/common";
import { validatePhoneNumber } from "../../utils/modal";
import { LoginOtp } from "../LoginOtp";
import { LoginPasswordLess } from "../LoginPasswordLess";
import SocialLoginList from "../SocialLoginList";

export interface LoginProps {
  isDark: boolean;
  appLogo?: string;
  appName?: string;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string; name: string } }) => void;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  totalExternalWallets: number;
  handleSocialLoginHeight: () => void;
}

export type rowType = {
  method: string;
  isDark: boolean;
  isPrimaryBtn: boolean;
  name: string;
  adapter: SocialLoginsConfig["adapter"];
  loginParams: { loginProvider: string; name: string; login_hint: string };
  order: number;
  isMainOption: boolean;
};

export const restrictedLoginMethods: string[] = [
  LOGIN_PROVIDER.WEBAUTHN,
  LOGIN_PROVIDER.JWT,
  LOGIN_PROVIDER.SMS_PASSWORDLESS,
  LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
  LOGIN_PROVIDER.AUTHENTICATOR,
  LOGIN_PROVIDER.PASSKEYS,
];

const Login = (props: LoginProps) => {
  const mergedProps = mergeProps({ appName: "Web3Auth", appLogo: "" }, props);
  const [fieldValue, setFieldValue] = createSignal<string>("");
  const [isValidInput, setIsValidInput] = createSignal<boolean>(true);
  const [expand, setExpand] = createSignal(false);
  const [canShowMore, setCanShowMore] = createSignal(false);
  const [visibleRow, setVisibleRow] = createSignal<rowType[]>([]);
  const [otherRow, setOtherRow] = createSignal<rowType[]>([]);
  const [isPasswordLessCtaClicked, setIsPasswordLessCtaClicked] = createSignal(false);
  const [showOtpFlow, setShowOtpFlow] = createSignal(false);
  const [otpLoading, setOtpLoading] = createSignal(true);
  const [isMobileOtp, setIsMobileOtp] = createSignal(false);
  const [otpSuccess, setOtpSuccess] = createSignal(false);

  const handleExpand = () => {
    setExpand((prev) => !prev);
    setIsPasswordLessCtaClicked(false);
    props.handleSocialLoginHeight();
  };

  createEffect(() => {
    const maxOptions = Object.keys(props.socialLoginsConfig.loginMethods).filter((loginMethodKey) => {
      return props.socialLoginsConfig.loginMethods[loginMethodKey].showOnModal;
    });

    const visibleRows: rowType[] = [];
    const otherRows: rowType[] = [];

    Object.keys(props.socialLoginsConfig.loginMethods)
      .filter((method) => {
        return !props.socialLoginsConfig.loginMethods[method].showOnModal === false && !restrictedLoginMethods.includes(method);
      })
      .forEach((method, index) => {
        const name = capitalizeFirstLetter(props.socialLoginsConfig.loginMethods[method].name || method);
        const orderIndex = props.socialLoginsConfig.loginMethodsOrder.indexOf(method) + 1;
        const order = orderIndex || index;

        const isMainOption = props.socialLoginsConfig.loginMethods[method].mainOption || order === 1;
        const isPrimaryBtn = props.socialLoginsConfig?.uiConfig?.primaryButton === "socialLogin" && order === 1;

        if (order > 0 && order < 4) {
          visibleRows.push({
            method,
            isDark: props.isDark,
            isPrimaryBtn,
            name,
            adapter: props.socialLoginsConfig.adapter,
            loginParams: { loginProvider: method, name, login_hint: "" },
            order,
            isMainOption,
          });
        }

        otherRows.push({
          method,
          isDark: props.isDark,
          isPrimaryBtn,
          name: name === "Twitter" ? "X" : name,
          adapter: props.socialLoginsConfig.adapter,
          loginParams: { loginProvider: method, name, login_hint: "" },
          order,
          isMainOption,
        });
      });

    setVisibleRow(visibleRows);
    setOtherRow(otherRows);
    setCanShowMore(maxOptions.length > 4); // Update the state based on the condition
  });

  const handleFormSubmit = async (e: Event) => {
    e.preventDefault();
    // setShowOtpFlow(true);
    // setTimeout(() => {
    //   setOtpLoading(false);
    //   setIsMobileOtp(true);
    // }, 3000);

    const value = fieldValue();

    if (mergedProps.isEmailPasswordLessLoginVisible) {
      const isEmailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
      if (isEmailValid) {
        return props.handleSocialLoginClick({
          adapter: props.socialLoginsConfig.adapter || "",
          loginParams: { loginProvider: LOGIN_PROVIDER.EMAIL_PASSWORDLESS, login_hint: value, name: "Email" },
        });
      }
    }
    if (mergedProps.isSmsPasswordLessLoginVisible) {
      const countryCode = "";
      const number = value.startsWith("+") ? value : `${countryCode}${value}`;
      const result = await validatePhoneNumber(number);
      if (result) {
        return props.handleSocialLoginClick({
          adapter: props.socialLoginsConfig.adapter || "",
          loginParams: { loginProvider: LOGIN_PROVIDER.SMS_PASSWORDLESS, login_hint: typeof result === "string" ? result : number, name: "Mobile" },
        });
      }
    }

    setIsValidInput(false);
    return undefined;
  };

  const handleInputChange = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    setFieldValue(target.value);
    if (isValidInput() === false) setIsValidInput(true);
  };

  const title = createMemo(() => {
    if (mergedProps.isEmailPasswordLessLoginVisible && mergedProps.isSmsPasswordLessLoginVisible) return t("modal.social.passwordless-title");
    if (mergedProps.isEmailPasswordLessLoginVisible) return t("modal.social.email");
    return t("modal.social.phone");
  });

  const placeholder = createMemo(() => {
    if (mergedProps.isEmailPasswordLessLoginVisible && mergedProps.isSmsPasswordLessLoginVisible) return "+(00)123456/name@example.com";
    if (mergedProps.isEmailPasswordLessLoginVisible) return "name@example.com";
    return "+(00)123456";
  });

  const invalidInputErrorMessage = createMemo(() => {
    if (mergedProps.isEmailPasswordLessLoginVisible && mergedProps.isSmsPasswordLessLoginVisible) return t("modal.errors-invalid-number-email");
    if (mergedProps.isEmailPasswordLessLoginVisible) return t("modal.errors-invalid-email");
    return t("modal.errors-invalid-number");
  });

  const handleConnectWallet = (e: MouseEvent) => {
    setIsPasswordLessCtaClicked(false);
    e.preventDefault();
    if (mergedProps.handleExternalWalletBtnClick) mergedProps.handleExternalWalletBtnClick(true);
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

  return (
    <Suspense>
      <Switch>
        <Match when={showOtpFlow()}>
          <LoginOtp
            otpLoading={otpLoading()}
            otpSuccess={otpSuccess()}
            setShowOtpFlow={setShowOtpFlow}
            isMobileOtp={isMobileOtp()}
            handleOtpComplete={handleOtpComplete}
          />
        </Match>
        <Match when={!showOtpFlow()}>
          <div class="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-4 w3a--p-4">
            <div class="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2 w3a--pt-10">
              <figure class="w3a--w-[200px] w3a--h-12 mx-auto">
                <img src={getIcons(props.isDark ? "dark-logo" : "light-logo")} alt="Logo" class="w3a--object-contain" />
              </figure>
              <p class="w3a--text-lg w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">Sign In</p>
            </div>

            <Show
              when={!expand()}
              fallback={
                <SocialLoginList
                  otherRow={otherRow()}
                  isDark={props.isDark}
                  visibleRow={visibleRow()}
                  canShowMore={canShowMore()}
                  handleSocialLoginClick={props.handleSocialLoginClick}
                  socialLoginsConfig={props.socialLoginsConfig}
                  handleExpandSocialLogins={handleExpand}
                />
              }
            >
              <Show when={mergedProps.areSocialLoginsVisible}>
                <SocialLoginList
                  otherRow={[]}
                  isDark={props.isDark}
                  visibleRow={visibleRow()}
                  canShowMore={canShowMore()}
                  handleSocialLoginClick={props.handleSocialLoginClick}
                  socialLoginsConfig={props.socialLoginsConfig}
                  handleExpandSocialLogins={handleExpand}
                />
              </Show>
              <Show when={mergedProps.showPasswordLessInput}>
                <LoginPasswordLess
                  isPasswordLessCtaClicked={isPasswordLessCtaClicked()}
                  setIsPasswordLessCtaClicked={setIsPasswordLessCtaClicked}
                  title={title()}
                  fieldValue={fieldValue()}
                  handleInputChange={handleInputChange}
                  placeholder={placeholder()}
                  handleFormSubmit={handleFormSubmit}
                  invalidInputErrorMessage={invalidInputErrorMessage()}
                  isValidInput={isValidInput()}
                  isDark={props.isDark}
                />
              </Show>
              <Show when={mergedProps.showExternalWalletButton && mergedProps.showPasswordLessInput}>
                <div class="w3a--flex w3a--items-center w3a--gap-x-2 w3a--w-full">
                  <div class="w3a--w-full w3a--h-[1px] w3a--bg-app-gray-200 dark:w3a--bg-app-gray-500" />
                  <p class="w3a--text-xs w3a--font-normal w3a--text-app-gray-400 dark:w3a--text-app-gray-400 w3a--uppercase">or</p>
                  <div class="w3a--w-full w3a--h-[1px] w3a--bg-app-gray-200 dark:w3a--bg-app-gray-500" />
                </div>
              </Show>
              <Show when={mergedProps.showExternalWalletButton}>
                <button class={cn("w3a--btn !w3a--justify-between w3a-external-wallet-btn")} onClick={handleConnectWallet}>
                  <p class="w3a--text-app-gray-900 dark:w3a--text-app-white">{t("modal.external.connect")}</p>
                  <div
                    id="external-wallet-count"
                    class="w3a--w-auto w3a--px-2.5 w3a--py-0.5 w3a--rounded-full w3a--bg-app-primary-100 dark:w3a--bg-transparent dark:w3a--border dark:w3a--border-app-primary-500 dark:w3a--text-app-primary-500 w3a--text-xs w3a--font-medium w3a--text-app-primary-800"
                  >
                    {props.totalExternalWallets - 1}+
                  </div>
                  <img
                    id="external-wallet-arrow"
                    class="w3a--icon-animation"
                    src={getIcons(props.isDark ? "chevron-right-dark" : "chevron-right-light")}
                    alt="arrow"
                  />
                </button>
              </Show>
            </Show>
          </div>
        </Match>
      </Switch>
    </Suspense>
  );
};

export default Login;
