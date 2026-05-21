import { AUTH_CONNECTION } from "@web3auth/auth";

import { cn, getIcons } from "../../utils";
import Button, { BUTTON_TYPE } from "../Button";
import LoginHint from "../LoginHint";
import { SocialLoginListProps } from "./SocialLoginList.type";

function getProviderIcon(method: string, isDark: boolean, extension: string) {
  const imageId = method === AUTH_CONNECTION.TWITTER ? `login-X${isDark ? "-light" : "-dark"}` : `login-${method}${isDark ? "-light" : "-dark"}`;
  const hoverId =
    method === AUTH_CONNECTION.APPLE || method === AUTH_CONNECTION.GITHUB || method === AUTH_CONNECTION.TWITTER ? imageId : `login-${method}-active`;
  return (
    <>
      <img
        id="active-login-img"
        src={`https://images.web3auth.io/${hoverId}${extension}`}
        alt="active-login-img"
        className="wta:hidden wta:size-5 wta:object-contain wta:group-hover:block"
      />
      <img
        id="login-img"
        src={`https://images.web3auth.io/${imageId}${extension}`}
        alt="login-img"
        className="wta:block wta:size-5 wta:object-contain wta:group-hover:hidden"
      />
    </>
  );
}

function SocialLoginList(props: SocialLoginListProps) {
  const { visibleRow, otherRow, mainOptionsRow, isDark, canShowMore, handleSocialLoginClick, handleExpandSocialLogins, buttonRadius } = props;

  const getGridRowFromVisibleLogin = () => {
    if (visibleRow.length === 1) {
      return "wta:grid-cols-1";
    } else if (visibleRow.length === 2) {
      return "wta:grid-cols-2";
    } else if (visibleRow.length === 3) {
      return "wta:grid-cols-3";
    } else {
      return "wta:grid-cols-4";
    }
  };

  if ((visibleRow.length !== 0 || mainOptionsRow.length !== 0) && otherRow?.length === 0) {
    return (
      <div className="wta:flex wta:w-full wta:flex-col wta:items-center wta:justify-center wta:gap-y-2">
        <div className="wta:grid wta:w-full wta:gap-y-2">
          {mainOptionsRow.map((row) => (
            <Button
              type={BUTTON_TYPE.SOCIAL}
              key={row.method}
              props={{
                showText: true,
                text: row.description,
                method: row.method,
                isDark,
                isPrimaryBtn: false,
                btnStyle: "wta:flex wta:items-center wta:justify-center! wta:w-full wta:h-11 wta:group",
                children: <>{getProviderIcon(row.method, isDark, ".svg")}</>,
                onClick: () => handleSocialLoginClick({ loginParams: row.loginParams }),
                buttonRadius,
              }}
            />
          ))}
        </div>
        <div className={cn("wta:grid wta:w-full wta:gap-x-2", getGridRowFromVisibleLogin())}>
          {visibleRow
            .filter((_, index) => (visibleRow.length === 4 ? index <= 3 : index < 3))
            .map((row) => (
              <LoginHint key={row.method} content={"Last Login"} isDark={isDark} hideHint={true}>
                <Button
                  type={BUTTON_TYPE.SOCIAL}
                  key={row.method}
                  props={{
                    showText: false,
                    method: row.method,
                    isDark,
                    isPrimaryBtn: false,
                    btnStyle: "wta:flex wta:items-center wta:justify-center! wta:w-full wta:h-11 wta:group",
                    children: <>{getProviderIcon(row.method, isDark, ".svg")}</>,
                    onClick: () => handleSocialLoginClick({ loginParams: row.loginParams }),
                    buttonRadius,
                  }}
                />
              </LoginHint>
            ))}
          {canShowMore && visibleRow.length > 4 && (
            <Button
              type={BUTTON_TYPE.SOCIAL}
              props={{
                isDark,
                showIcon: false,
                onClick: handleExpandSocialLogins,
                btnStyle: "wta:flex wta:items-center wta:justify-center! wta:w-full wta:h-11",
                children: <img src={getIcons(isDark ? "dots-dark-horizontal" : "dots-light-horizontal")} alt="Logo" className="wta:object-contain" />,
                buttonRadius,
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wta:flex wta:w-full wta:flex-col wta:items-start wta:justify-start wta:gap-y-4">
      <button type="button" className="wta:appearance-none" onClick={() => handleExpandSocialLogins()}>
        <img src={getIcons(isDark ? "arrow-left-dark" : "arrow-left-light")} alt="Logo" className="wta:object-contain" />
      </button>
      <div className="w3a--social-container wta:grid wta:h-[300px] wta:w-full wta:auto-rows-min wta:grid-cols-1 wta:gap-y-2 wta:overflow-y-auto wta:pl-2 wta:pr-3">
        {otherRow.map((row) => (
          <div className="wta:h-11 wta:w-full" key={row.method}>
            <Button
              type={BUTTON_TYPE.SOCIAL}
              props={{
                method: row.method,
                isDark,
                isPrimaryBtn: false,
                onClick: () => handleSocialLoginClick({ loginParams: row.loginParams }),
                btnStyle: "wta:group wta:relative wta:overflow-hidden wta:flex wta:items-center wta:justify-start! wta:w-full wta:h-11",
                buttonRadius,
                children: (
                  <>
                    {getProviderIcon(row.method, isDark, ".svg")}
                    <p className="wta:text-sm wta:font-normal wta:text-app-gray-900 wta:dark:text-app-white">{row.name}</p>
                    <img
                      id="login-arrow"
                      className="wta:absolute wta:right-4 wta:top-1/2 wta:-translate-x-10 wta:-translate-y-1/2 wta:opacity-0 wta:transition-all wta:duration-300
          wta:group-hover:translate-x-0 wta:group-hover:opacity-100"
                      src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
                      alt="arrow"
                    />
                  </>
                ),
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SocialLoginList;
