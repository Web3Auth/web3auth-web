import { LOGIN_PROVIDER } from "@web3auth/auth";
import { createEffect, createSignal, For, Show } from "solid-js";

import { capitalizeFirstLetter } from "../../config";
import { SocialLoginsConfig } from "../../interfaces";
import { cn } from "../../utils/common";
import { SocialLoginButton } from "../SocialLoginButton";

export interface SocialLoginListProps {
  socialLoginsConfig: SocialLoginsConfig;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string; name: string } }) => void;
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

const SocialLoginList = (props: SocialLoginListProps) => {
  const [expand, setExpand] = createSignal(false);
  const [canShowMore, setCanShowMore] = createSignal(false);
  const [mainOption, setMainOption] = createSignal<rowType>(null);
  const [visibleRow, setVisibleRow] = createSignal<rowType[]>([]);
  const [otherRows, setOtherRows] = createSignal<rowType[]>([]);

  const isDark = false;

  const handleExpand = () => {
    setExpand((prev) => !prev);
  };

  createEffect(() => {
    const maxOptions = Object.keys(props.socialLoginsConfig.loginMethods).filter((loginMethodKey) => {
      return props.socialLoginsConfig.loginMethods[loginMethodKey].showOnModal;
    });

    Object.keys(props.socialLoginsConfig.loginMethods)
      .filter((method) => {
        return !props.socialLoginsConfig.loginMethods[method].showOnModal === false || !restrictedLoginMethods.includes(method);
      })
      .forEach((method, index) => {
        const name = capitalizeFirstLetter(props.socialLoginsConfig.loginMethods[method].name || method);
        const orderIndex = props.socialLoginsConfig.loginMethodsOrder.indexOf(method) + 1;
        const order = orderIndex || index;

        const isMainOption = props.socialLoginsConfig.loginMethods[method].mainOption;
        const isPrimaryBtn = props.socialLoginsConfig?.uiConfig?.primaryButton === "socialLogin" && order === 1;

        if (isMainOption) {
          setMainOption({
            method,
            isDark,
            isPrimaryBtn,
            name,
            adapter: props.socialLoginsConfig.adapter,
            loginParams: { loginProvider: method, name, login_hint: "" },
            order,
            isMainOption,
          });
        }

        if (!isMainOption && order > 0 && order <= 3) {
          setVisibleRow((prev) => [
            ...prev,
            {
              method,
              isDark,
              isPrimaryBtn,
              name,
              adapter: props.socialLoginsConfig.adapter,
              loginParams: { loginProvider: method, name, login_hint: "" },
              order,
              isMainOption,
            } as unknown as rowType,
          ]);
        }

        if (!isMainOption && order > 3) {
          setOtherRows((prev) => [
            ...prev,
            {
              method,
              isDark,
              isPrimaryBtn,
              name,
              adapter: props.socialLoginsConfig.adapter,
              loginParams: { loginProvider: method, name, login_hint: "" },
              order,
              isMainOption,
            } as unknown as rowType,
          ]);
        }
      });

    setCanShowMore(maxOptions.length > 4); // Update the state based on the condition
  });

  return (
    <div class="w3a--flex w3a--flex-col w3a--w-full w3a--gap-y-2">
      <Show when={mainOption()}>
        <SocialLoginButton
          method={mainOption().method}
          isDark={isDark}
          isPrimaryBtn={mainOption().isPrimaryBtn}
          onClick={() =>
            props.handleSocialLoginClick({
              adapter: mainOption().adapter,
              loginParams: mainOption().loginParams,
            })
          }
        />
      </Show>

      <Show when={visibleRow().length > 0}>
        <div class="w3a--grid w3a--grid-cols-3 w3a--gap-x-2 w3a--gap-y-2">
          <For each={visibleRow()}>
            {(row) => (
              <SocialLoginButton
                showText={false}
                method={row.method}
                isDark={isDark}
                isPrimaryBtn={row.isPrimaryBtn}
                onClick={() =>
                  props.handleSocialLoginClick({
                    adapter: row.adapter,
                    loginParams: row.loginParams,
                  })
                }
              />
            )}
          </For>
        </div>
      </Show>

      {/* 224px */}
      <Show when={otherRows().length > 0}>
        <div
          class={cn(
            "w3a--grid w3a--grid-cols-3 w3a--gap-x-2 w3a--gap-y-2 w3a--overflow-hidden w3a--transition-all w3a--duration-700 w3a--ease-linear",
            { "w3a--max-h-[192px]": expand(), "w3a--max-h-0": !expand() }
          )}
        >
          <For each={otherRows()}>
            {(row) => (
              <SocialLoginButton
                showText={false}
                method={row.method}
                isDark={isDark}
                isPrimaryBtn={row.isPrimaryBtn}
                onClick={() =>
                  props.handleSocialLoginClick({
                    adapter: row.adapter,
                    loginParams: row.loginParams,
                  })
                }
              />
            )}
          </For>
        </div>
      </Show>

      <p class="w3a--text-xs w3a--font-normal w3a--text-app-gray-500 w3a--text-start">We do not store any data related to your social logins.</p>

      <Show when={canShowMore()}>
        <button
          type="button"
          class="w3a--text-xs w3a--font-normal w3a--text-app-primary-600 hover:w3a--text-app-primary-500 dark:w3a--text-app-primary-500 dark:hover:w3a--text-app-primary-600 w3a--text-right"
          onClick={handleExpand}
        >
          {expand() ? "View Less" : "View More"}
        </button>
      </Show>
    </div>
  );
};

export default SocialLoginList;
