import { LOGIN_PROVIDER } from "@web3auth/auth";
import { createEffect, createMemo, createSignal, mergeProps, Show } from "solid-js";

import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT, SocialLoginsConfig } from "../../interfaces";
import { cn } from "../../utils/common";
import { validatePhoneNumber } from "../../utils/modal";
import SocialLoginList from "../SocialLoginList";

export interface LoginProps {
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
}

const Login = (props: LoginProps) => {
  const mergedProps = mergeProps({ appName: "Web3Auth", appLogo: "" }, props);
  const [fieldValue, setFieldValue] = createSignal<string>("");
  const [countryCode, setCountryCode] = createSignal<string>("");
  const [isValidInput, setIsValidInput] = createSignal<boolean | null>(null);

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
      const number = value.startsWith("+") ? value : `${countryCode()}${value}`;
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

  createEffect(() => {
    // const getLocation = async () => {
    //   const result = await getUserCountry();
    //   if (result && result.dialCode) {
    //     setCountryCode(result.dialCode);
    //   }
    // };
    // if (mergedProps.isSmsPasswordLessLoginVisible) getLocation();
    // eslint-disable-next-line no-console
    console.log(setCountryCode);
  });

  const handleInputChange = (e: { target: { value: string } }) => {
    setFieldValue(e.target.value);
    if (isValidInput() === false) setIsValidInput(null);
  };

  const title = createMemo(() => {
    if (mergedProps.isEmailPasswordLessLoginVisible && mergedProps.isSmsPasswordLessLoginVisible) return "modal.social.passwordless-title";
    if (mergedProps.isEmailPasswordLessLoginVisible) return "modal.social.email";
    return "modal.social.phone";
  });

  const placeholder = createMemo(() => {
    if (mergedProps.isEmailPasswordLessLoginVisible && mergedProps.isSmsPasswordLessLoginVisible) return "+(00)123456/name@example.com";
    if (mergedProps.isEmailPasswordLessLoginVisible) return "name@example.com";
    return "+(00)123456";
  });

  const invalidInputErrorMessage = createMemo(() => {
    if (mergedProps.isEmailPasswordLessLoginVisible && mergedProps.isSmsPasswordLessLoginVisible) return "modal.errors-invalid-number-email";
    if (mergedProps.isEmailPasswordLessLoginVisible) return "modal.errors-invalid-email";
    return "modal.errors-invalid-number";
  });

  const handleConnectWallet = (e: MouseEvent) => {
    e.preventDefault();
    if (mergedProps.handleExternalWalletBtnClick) mergedProps.handleExternalWalletBtnClick(true);
  };

  const headerLogo = createMemo(() => ([DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT].includes(mergedProps.appLogo) ? "" : mergedProps.appLogo));

  const subtitle = createMemo(() => {
    return `modal.header-subtitle-name, ${mergedProps.appName}`;
  });

  return (
    <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--h-full">
      <div class="w3a--flex w3a--flex-col w3a--items-start w3a--gap-y-1">
        <Show when={headerLogo()}>
          <div class="w3a--header-logo-size">
            <img src={headerLogo()} alt="Logo" />
          </div>
        </Show>
        <p class="w3a--text-xl w3a--font-bold w3a--text-app-gray-900 dark:w3a--text-app-white">{"modal.header-title"}</p>
        <p class="w3a--text-sm w3a--font-normal w3a--text-app-gray-500 dark:w3a--text-app-gray-400">{subtitle()}</p>
      </div>

      <Show when={mergedProps.areSocialLoginsVisible}>
        <SocialLoginList handleSocialLoginClick={props.handleSocialLoginClick} socialLoginsConfig={props.socialLoginsConfig} />
      </Show>

      <Show when={mergedProps.showPasswordLessInput || mergedProps.showExternalWalletButton}>
        <form class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--mt-auto">
          <Show when={mergedProps.showPasswordLessInput}>
            <div class="w3a--flex w3a--flex-col w3a--gap-y-2">
              <label class="w3a--text-sm w3a--font-semibold w3a--text-app-gray-500 dark:w3a--text-app-gray-400 w3a--text-start">{title()}</label>
              <input
                onInput={handleInputChange}
                value={fieldValue()}
                placeholder={placeholder()}
                onFocus={(e) => {
                  e.target.placeholder = "";
                }}
                onBlur={(e) => {
                  e.target.placeholder = `${placeholder()}`;
                }}
                class="w3a--px-4 w3a--py-2.5 w3a--border w3a--border-app-gray-300 w3a--bg-app-gray-50 placeholder:w3a--text-app-gray-400 placeholder:w3a--text-sm placeholder:w3a--font-normal w3a--rounded-full"
              />
            </div>
            <Show when={isValidInput() === false}>
              <div class="w3a--text-sm w3a--font-normal w3a--text-app-red-500 dark:w3a--text-app-red-400 w3a--text-start">
                {invalidInputErrorMessage()}
              </div>
            </Show>
            <button
              class={cn("w3a--w-full w3a--px-5 w3a--py-3 w3a--rounded-full w3a--text-sm w3a--font-medium", {
                "w3a--bg-app-gray-100 disabled:w3a--text-app-gray-400 w3a--text-app-gray-900": !props.isEmailPrimary,
                "w3a--bg-app-primary-600 disabled:w3a--bg-app-primary-500 w3a--text-app-white w3a--opacity-15": props.isEmailPrimary,
              })}
              onClick={handleFormSubmit}
            >
              {"modal.social.passwordless-cta"}
            </button>
          </Show>
          <Show when={mergedProps.showExternalWalletButton}>
            <div class="w3a--flex w3a--flex-col w3a--gap-y-2">
              <label class="w3a--text-sm w3a--font-semibold w3a--text-app-gray-500 dark:w3a--text-app-gray-400 w3a--text-start">
                {"modal.external.title"}
              </label>
              <button
                class={cn("w3a--w-full w3a--px-5 w3a--py-3 w3a--rounded-full w3a--text-sm w3a--font-medium", {
                  "w3a--bg-app-gray-100 disabled:w3a--text-app-gray-400 w3a--text-app-gray-900": !props.isExternalPrimary,
                  "w3a--bg-app-primary-600 disabled:w3a--bg-app-primary-500 w3a--text-app-white w3a--opacity-15": props.isExternalPrimary,
                })}
                onClick={handleConnectWallet}
              >
                {"modal.external.connect"}
              </button>
            </div>
          </Show>
        </form>
      </Show>
    </div>
  );
};

export default Login;
