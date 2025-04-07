import { AUTH_CONNECTION } from "@web3auth/auth";

import { cn, getIcons } from "../../utils";
import Button, { BUTTON_TYPE } from "../Button";
import LoginHint from "../LoginHint";
import { SocialLoginListProps } from "./SocialLoginList.type";

function getProviderIcon(method: string, isDark: boolean, extension: string) {
  const imageId =
    method === AUTH_CONNECTION.TWITTER ? `login-twitter-x${isDark ? "-light" : "-dark"}` : `login-${method}${isDark ? "-light" : "-dark"}`;
  const hoverId =
    method === AUTH_CONNECTION.APPLE || method === AUTH_CONNECTION.GITHUB || method === AUTH_CONNECTION.TWITTER ? imageId : `login-${method}-active`;
  return (
    <>
      <img
        id="active-login-img"
        src={`https://images.web3auth.io/${hoverId}${extension}`}
        alt="active-login-img"
        className="w3a--size-5 w3a--object-contain"
      />
      <img id="login-img" src={`https://images.web3auth.io/${imageId}${extension}`} alt="login-img" className="w3a--size-5 w3a--object-contain" />
    </>
  );
}

function SocialLoginList(props: SocialLoginListProps) {
  const { visibleRow, otherRow, isDark, canShowMore, handleSocialLoginClick, handleExpandSocialLogins, buttonRadius } = props;

  const getGridRowFromVisibleLogin = () => {
    if (visibleRow.length === 1) {
      return "w3a--grid-cols-1";
    } else if (visibleRow.length === 2) {
      return "w3a--grid-cols-2";
    } else if (visibleRow.length === 3) {
      return "w3a--grid-cols-3";
    } else {
      return "w3a--grid-cols-4";
    }
  };

  if (visibleRow.length !== 0 && otherRow?.length === 0) {
    const isMainOption = visibleRow[0]?.isMainOption;
    const rowsToShow = isMainOption ? visibleRow.filter((row) => !row.isMainOption) : visibleRow;
    return (
      <div className="w3a--flex w3a--w-full w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2">
        {isMainOption && (
          <Button
            type={BUTTON_TYPE.SOCIAL}
            key={visibleRow[0].method}
            props={{
              showText: false,
              method: visibleRow[0].method,
              isDark,
              isPrimaryBtn: false,
              btnStyle: "w3a--flex w3a--items-center !w3a--justify-center w3a--w-full w3a--h-full w3a-arrow w3a-img-login-group",
              children: <>{getProviderIcon(visibleRow[0].method, isDark, ".svg")}</>,
              onClick: () => handleSocialLoginClick({ connector: visibleRow[0].connector, loginParams: visibleRow[0].loginParams }),
              buttonRadius,
            }}
          />
        )}
        <div className={cn("w3a--grid w3a--w-full w3a--gap-x-2", getGridRowFromVisibleLogin())}>
          {rowsToShow
            .filter((_, index) => (rowsToShow.length === 4 ? index <= 3 : index < 3))
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
                    btnStyle: "w3a--flex w3a--items-center !w3a--justify-center w3a--w-full w3a--h-full w3a-arrow w3a-img-login-group",
                    children: <>{getProviderIcon(row.method, isDark, ".svg")}</>,
                    onClick: () => handleSocialLoginClick({ connector: row.connector, loginParams: row.loginParams }),
                    buttonRadius,
                  }}
                />
              </LoginHint>
            ))}
          {canShowMore && rowsToShow.length > 4 && (
            <Button
              type={BUTTON_TYPE.SOCIAL}
              props={{
                showIcon: false,
                onClick: handleExpandSocialLogins,
                children: (
                  <img src={getIcons(isDark ? "dots-dark-horizontal" : "dots-light-horizontal")} alt="Logo" className="w3a--object-contain" />
                ),
                buttonRadius,
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w3a--flex w3a--w-full w3a--flex-col w3a--items-start w3a--justify-start w3a--gap-y-4">
      <button type="button" className="w3a--appearance-none" onClick={() => handleExpandSocialLogins()}>
        <img src={getIcons(isDark ? "arrow-left-dark" : "arrow-left-light")} alt="Logo" className="w3a--object-contain" />
      </button>
      <div className="w3a--grid w3a--h-[344px] w3a--w-full w3a--auto-rows-min w3a--grid-cols-1 w3a--gap-y-2 w3a--overflow-y-auto w3a--px-1">
        {otherRow.map((row) => (
          <div className="w3a--h-[50px] w3a--w-full" key={row.method}>
            <Button
              type={BUTTON_TYPE.SOCIAL}
              props={{
                method: row.method,
                isDark,
                isPrimaryBtn: false,
                onClick: () => handleSocialLoginClick({ connector: row.connector, loginParams: row.loginParams }),
                btnStyle: "w3a--flex w3a--items-center !w3a--justify-start w3a--w-full w3a--h-full w3a-arrow w3a-img-login-group",
                buttonRadius,
                children: (
                  <>
                    {getProviderIcon(row.method, isDark, ".svg")}
                    <p className="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">{row.name}</p>
                    <img
                      id="login-arrow"
                      className="w3a--icon-animation w3a--ml-auto"
                      src={getIcons(props.isDark ? "chevron-right-dark" : "chevron-right-light")}
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
