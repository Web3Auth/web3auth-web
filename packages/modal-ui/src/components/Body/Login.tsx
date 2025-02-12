import { LOGIN_PROVIDER } from "@web3auth/auth";
import { createEffect, createMemo, createSignal, mergeProps, Show } from "solid-js";

import ArrowRightDark from "../../assets/chevron-right-dark.svg";
import ArrowRightLight from "../../assets/chevron-right-light.svg";
import LogoDark from "../../assets/dark-logo.svg";
import LogoLight from "../../assets/light-logo.svg";
import { capitalizeFirstLetter } from "../../config";
import { SocialLoginsConfig } from "../../interfaces";
import { t } from "../../localeImport";
import { cn } from "../../utils/common";
import { validatePhoneNumber } from "../../utils/modal";
// import OtpInput from "../Otp/Otp";
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
  const [isPasswordlessCtaClicked, setIsPasswordlessCtaClicked] = createSignal(false);
  const [isInputFocused, setIsInputFocused] = createSignal(false);

  const handleExpand = () => {
    setExpand((prev) => !prev);
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
          name,
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

  const handleInputChange = (e: { target: { value: string } }) => {
    setFieldValue(e.target.value);
    if (isValidInput() === false) setIsValidInput(null);
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
    setIsPasswordlessCtaClicked(false);
    e.preventDefault();
    if (mergedProps.handleExternalWalletBtnClick) mergedProps.handleExternalWalletBtnClick(true);
  };

  return (
    <div class="w3a--flex w3a--flex-col w3a--items-center w3a--gap-y-4 w3a--p-4">
      <div class="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2 w3a--pt-10">
        <figure class="w3a--w-[200px] w3a--h-12 mx-auto">
          <img src={LogoDark} alt="Logo" class="w3a--object-contain w3a--hidden dark:w3a--block" />
          <img src={LogoLight} alt="Logo" class="w3a--object-contain w3a--block dark:w3a--hidden" />
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
          <Show
            when={isPasswordlessCtaClicked()}
            fallback={
              <button class={cn("w3a--btn !w3a--justify-between")} onClick={() => setIsPasswordlessCtaClicked(true)}>
                <p class="w3a--text-app-gray-900 dark:w3a--text-app-white">Continue with {title()}</p>
              </button>
            }
          >
            <div class={cn("w3a--input", isInputFocused() && "!w3a--border-app-primary-600")}>
              <input
                onInput={handleInputChange}
                value={fieldValue()}
                placeholder={placeholder()}
                onFocus={(e) => {
                  e.target.placeholder = "";
                  setIsInputFocused(true);
                }}
                onBlur={(e) => {
                  e.target.placeholder = `${placeholder()}`;
                  setIsInputFocused(false);
                }}
                type="text"
                autofocus
                class="w3a--appearance-none w3a--outline-none active:w3a--outline-none focus:w3a--outline-none w3a--bg-transparent placeholder:w3a--text-app-gray-400 dark:placeholder:w3a--text-app-gray-500 w3a--text-app-gray-900 dark:w3a--text-app-white"
              />
              <button class="w3a--appearance-none w3a--icon-animation" onClick={handleFormSubmit}>
                <img src={props.isDark ? ArrowRightDark : ArrowRightLight} alt="arrow" />
              </button>
            </div>
            <Show when={!isValidInput() && isPasswordlessCtaClicked()}>
              <p class="w3a--text-xs w3a--font-normal w3a--text-app-red-500 dark:w3a--text-app-red-400 w3a--text-start -w3a--mt-2 w3a--w-full w3a--pl-6">
                {invalidInputErrorMessage()}
              </p>
            </Show>
          </Show>
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
            <img id="external-wallet-arrow" class="w3a--icon-animation" src={props.isDark ? ArrowRightDark : ArrowRightLight} alt="arrow" />
          </button>
        </Show>
        {/* <OtpInput length={6} onComplete={() => {}} /> */}
      </Show>
    </div>
  );
};

export default Login;
