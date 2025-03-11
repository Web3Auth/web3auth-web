import { LOGIN_PROVIDER } from "@web3auth/auth";
import { For, Show } from "solid-js";

import { SocialLoginsConfig } from "../../interfaces";
import { getIcons } from "../../utils/common";
import { rowType } from "../Body/Login";
import { SocialLoginButton } from "../SocialLoginButton";
export interface SocialLoginListProps {
  isDark: boolean;
  visibleRow: rowType[];
  canShowMore: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string; name: string } }) => void;
  handleExpandSocialLogins: () => void;
  otherRow?: rowType[];
}

function getProviderIcon(method: string, isDark: boolean, extension: string) {
  const imageId =
    method === LOGIN_PROVIDER.TWITTER ? `login-twitter-x${isDark ? "-light" : "-dark"}` : `login-${method}${isDark ? "-light" : "-dark"}`;
  const hoverId =
    method === LOGIN_PROVIDER.APPLE || method === LOGIN_PROVIDER.GITHUB || method === LOGIN_PROVIDER.TWITTER ? imageId : `login-${method}-active`;
  return (
    <>
      <img
        id="active-login-img"
        src={`https://images.web3auth.io/${hoverId}${extension}`}
        alt="active-login-img"
        class="w3a--object-contain w3a--w-5 w3a--h-5"
      />
      <img id="login-img" src={`https://images.web3auth.io/${imageId}${extension}`} alt="login-img" class="w3a--object-contain w3a--w-5 w3a--h-5" />
    </>
  );
}

const SocialLoginList = (props: SocialLoginListProps) => {
  return (
    <>
      <Show when={props.visibleRow.length > 0 && props.otherRow?.length === 0}>
        <div class="w3a--grid w3a--grid-cols-4 w3a--gap-x-2 w3a--w-full">
          <For each={props.visibleRow}>
            {(row) => (
              <>
                <SocialLoginButton
                  showText={false}
                  method={row.method}
                  isDark={props.isDark}
                  isPrimaryBtn={false}
                  onClick={() =>
                    props.handleSocialLoginClick({
                      adapter: row.adapter,
                      loginParams: row.loginParams,
                    })
                  }
                  showIcon={true}
                />
              </>
            )}
          </For>
          <Show when={props.canShowMore}>
            <SocialLoginButton isDark={props.isDark} showIcon={false} onClick={props.handleExpandSocialLogins}>
              <img src={getIcons(props.isDark ? "dots-dark-horizontal" : "dots-light-horizontal")} alt="Logo" class="w3a--object-contain" />
            </SocialLoginButton>
          </Show>
        </div>
      </Show>
      <Show when={props.otherRow?.length > 0}>
        <div class="w3a--flex w3a--flex-col w3a--items-start w3a--justify-start w3a--gap-y-4 w3a--w-full">
          <button type="button" class="w3a--appearance-none" onClick={() => props.handleExpandSocialLogins()}>
            <img src={getIcons(props.isDark ? "arrow-left-dark" : "arrow-left-light")} alt="Logo" class="w3a--object-contain" />
          </button>
          <div class="w3a--grid w3a--grid-cols-1 w3a--gap-y-2 w3a--w-full w3a--h-[344px] w3a--overflow-y-auto px-1">
            <For each={props.otherRow}>
              {(row) => (
                <div class="w3a--w-full w3a--h-[50px]">
                  <SocialLoginButton
                    method={row.method}
                    isDark={props.isDark}
                    isPrimaryBtn={false}
                    onClick={() =>
                      props.handleSocialLoginClick({
                        adapter: row.adapter,
                        loginParams: row.loginParams,
                      })
                    }
                    btnStyle="w3a--flex w3a--items-center !w3a--justify-start w3a--w-full w3a--h-full w3a-arrow w3a-img-login-group"
                  >
                    <>
                      {getProviderIcon(row.method, props.isDark, ".svg")}
                      <p class="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">{row.name}</p>
                      <img
                        id="login-arrow"
                        class="w3a--icon-animation w3a--ml-auto"
                        src={getIcons(props.isDark ? "chevron-right-dark" : "chevron-right-light")}
                        alt="arrow"
                      />
                    </>
                  </SocialLoginButton>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  );
};

export default SocialLoginList;
