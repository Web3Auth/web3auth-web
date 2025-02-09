import { For, Show } from "solid-js";

import ArrowLeft from "../../assets/arrow-left-light.svg";
import DotLight from "../../assets/dots-light-horizontal.svg";
import { SocialLoginsConfig } from "../../interfaces";
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
              <img src={DotLight} alt="Logo" class="w3a--object-contain" />
            </SocialLoginButton>
          </Show>
        </div>
      </Show>
      <Show when={props.otherRow?.length > 0}>
        <div class="w3a--flex w3a--flex-col w3a--items-start w3a--justify-start w3a--gap-y-4 w3a--w-full">
          <button type="button" class="w3a--appearance-none" onClick={() => props.handleExpandSocialLogins()}>
            <img src={ArrowLeft} alt="arrow" />
          </button>
          <div class="w3a--grid w3a--grid-cols-1 w3a--gap-y-2 w3a--w-full w3a--h-[344px] w3a--overflow-y-auto">
            <For each={props.otherRow}>
              {(row) => (
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
                  showIcon={true}
                  showText={true}
                  text={row.name}
                  btnStyle="!w3a--items-start !w3a--justify-start"
                />
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  );
};

export default SocialLoginList;
