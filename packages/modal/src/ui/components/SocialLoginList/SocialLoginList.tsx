import { LOGIN_PROVIDER } from "@web3auth/auth";

import { getIcons } from "../../utils";
import Button from "../Button";
import { SocialLoginListProps } from "./SocialLoginList.type";

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
        className="w3a--object-contain w3a--w-5 w3a--h-5"
      />
      <img
        id="login-img"
        src={`https://images.web3auth.io/${imageId}${extension}`}
        alt="login-img"
        className="w3a--object-contain w3a--w-5 w3a--h-5"
      />
    </>
  );
}

function SocialLoginList(props: SocialLoginListProps) {
  const { visibleRow, otherRow, isDark, canShowMore, handleSocialLoginClick, handleExpandSocialLogins } = props;

  if (visibleRow.length !== 0 && otherRow?.length === 0) {
    return (
      <div className="w3a--grid w3a--grid-cols-4 w3a--gap-x-2 w3a--w-full">
        {visibleRow.map((row) => (
          <Button
            type="social"
            key={row.method}
            props={{
              showText: false,
              method: row.method,
              isDark,
              isPrimaryBtn: false,
              btnStyle: "w3a--flex w3a--items-center !w3a--justify-center w3a--w-full w3a--h-full w3a-arrow w3a-img-login-group",
              children: <>{getProviderIcon(row.method, isDark, ".svg")}</>,
              onClick: () => handleSocialLoginClick({ connector: row.adapter, loginParams: row.loginParams }),
            }}
          />
        ))}
        {canShowMore && (
          <Button
            type="social"
            props={{
              showIcon: false,
              onClick: handleExpandSocialLogins,
              children: <img src={getIcons(isDark ? "dots-dark-horizontal" : "dots-light-horizontal")} alt="Logo" className="w3a--object-contain" />,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w3a--flex w3a--flex-col w3a--items-start w3a--justify-start w3a--gap-y-4 w3a--w-full">
      <button type="button" className="w3a--appearance-none" onClick={() => handleExpandSocialLogins()}>
        <img src={getIcons(isDark ? "arrow-left-dark" : "arrow-left-light")} alt="Logo" className="w3a--object-contain" />
      </button>
      <div className="w3a--grid w3a--grid-cols-1 w3a--gap-y-2 w3a--w-full w3a--h-[344px] w3a--overflow-y-auto px-1">
        {otherRow.map((row) => (
          <div className="w3a--w-full w3a--h-[50px]" key={row.method}>
            <Button
              type="social"
              props={{
                method: row.method,
                isDark,
                isPrimaryBtn: false,
                onClick: () => handleSocialLoginClick({ connector: row.adapter, loginParams: row.loginParams }),
                btnStyle: "w3a--flex w3a--items-center !w3a--justify-start w3a--w-full w3a--h-full w3a-arrow w3a-img-login-group",
                children: (
                  <>
                    {getProviderIcon(row.method, isDark, ".svg")}
                    <p className="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">{row.name}</p>
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
