import { mergeProps, Show } from "solid-js";

import { SocialLoginsConfig } from "../../interfaces";
import { cn } from "../../utils/common";
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
}

const Login = (props: LoginProps) => {
  const mergedProps = mergeProps({ appName: "Web3Auth", appLogo: "" }, props);

  const handleConnectWallet = (e: MouseEvent) => {
    e.preventDefault();
    if (mergedProps.handleExternalWalletBtnClick) mergedProps.handleExternalWalletBtnClick(true);
  };

  return (
    <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--h-full">
      <div class="w3a--flex w3a--flex-col w3a--items-start w3a--gap-y-1">
        <p class="w3a--text-xl w3a--font-bold w3a--text-app-gray-900 dark:w3a--text-app-white">Sign in</p>
        <p class="w3a--text-sm w3a--font-normal w3a--text-app-gray-500 dark:w3a--text-app-gray-400">
          Your {mergedProps.appName} wallet with one click
        </p>
      </div>

      <Show when={props.areSocialLoginsVisible}>
        <SocialLoginList handleSocialLoginClick={props.handleSocialLoginClick} socialLoginsConfig={props.socialLoginsConfig} />
      </Show>

      <Show when={mergedProps.showPasswordLessInput || mergedProps.showExternalWalletButton}>
        <form class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--mt-auto">
          <Show when={mergedProps.showPasswordLessInput}>
            <div class="w3a--flex w3a--flex-col w3a--gap-y-2">
              <label class="w3a--text-sm w3a--font-semibold w3a--text-app-gray-900 w3a--text-start">Email or Phone</label>
              <input
                placeholder="E.g. +00-123455/name@example.com"
                class="w3a--px-4 w3a--py-2.5 w3a--border w3a--border-app-gray-300 w3a--bg-app-gray-50 placeholder:w3a--text-app-gray-400 placeholder:w3a--text-sm placeholder:w3a--font-normal w3a--rounded-full"
              />
            </div>
            <button
              class={cn("w3a--w-full w3a--px-5 w3a--py-3 w3a--rounded-full w3a--text-sm w3a--font-medium", {
                "w3a--bg-app-gray-100 disabled:w3a--text-app-gray-400 w3a--text-app-gray-900": !props.isEmailPrimary,
                "w3a--bg-app-primary-600 disabled:w3a--bg-app-primary-500 w3a--text-app-white w3a--opacity-15": props.isEmailPrimary,
              })}
            >
              Continue with Email
            </button>
          </Show>
          <Show when={mergedProps.showExternalWalletButton}>
            <div class="w3a--flex w3a--flex-col w3a--gap-y-2">
              <label class="w3a--text-sm w3a--font-semibold w3a--text-app-gray-900 w3a--text-start">External Wallet</label>
              <button
                class={cn("w3a--w-full w3a--px-5 w3a--py-3 w3a--rounded-full w3a--text-sm w3a--font-medium", {
                  "w3a--bg-app-gray-100 disabled:w3a--text-app-gray-400 w3a--text-app-gray-900": !props.isExternalPrimary,
                  "w3a--bg-app-primary-600 disabled:w3a--bg-app-primary-500 w3a--text-app-white w3a--opacity-15": props.isExternalPrimary,
                })}
                onClick={handleConnectWallet}
              >
                Connect with Wallet
              </button>
            </div>
          </Show>
        </form>
      </Show>
    </div>
  );
};

export default Login;
