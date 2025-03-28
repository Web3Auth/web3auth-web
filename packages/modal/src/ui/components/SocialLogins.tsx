import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import classNames from "classnames";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { capitalizeFirstLetter } from "../config";
import { ThemedContext } from "../context/ThemeContext";
import { ModalLoginParams, SocialLoginsConfig } from "../interfaces";
import i18n from "../localeImport";
import Button from "./Button";
import Image from "./Image";

// const hasLightIcons = ["apple", "github"];

interface SocialLoginProps {
  socialLoginsConfig: SocialLoginsConfig;
  handleSocialLoginClick: (params: { connector: string; loginParams: ModalLoginParams }) => void;
}

function getProviderIcon(method: string, isDark: boolean, isPrimaryBtn: boolean) {
  const imageId =
    method === AUTH_CONNECTION.TWITTER ? `login-twitter-x${isDark ? "-light" : "-dark"}` : `login-${method}${isDark ? "-light" : "-dark"}`;
  const hoverId =
    method === AUTH_CONNECTION.APPLE || method === AUTH_CONNECTION.GITHUB || method === AUTH_CONNECTION.TWITTER ? imageId : `login-${method}-active`;

  if (isPrimaryBtn) {
    return <Image width="20" imageId={hoverId} hoverImageId={hoverId} isButton />;
  }

  return <Image width="20" imageId={imageId} hoverImageId={hoverId} isButton />;
}

export default function SocialLogins(props: SocialLoginProps) {
  const [canShowMore, setCanShowMore] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    socialLoginsConfig = {
      loginMethods: {},
      loginMethodsOrder: [],
      connector: "",
      uiConfig: {},
    },
    handleSocialLoginClick,
  } = props;
  const { isDark } = useContext(ThemedContext);

  const [t] = useTranslation(undefined, { i18n });

  // Too small a function to use `useCallback`
  const expandClickHandler = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const maxOptions = Object.keys(socialLoginsConfig.loginMethods).filter((loginMethodKey) => {
      return socialLoginsConfig.loginMethods[loginMethodKey as AUTH_CONNECTION_TYPE].showOnModal;
    });
    setCanShowMore(maxOptions.length > 4);
  }, [socialLoginsConfig.loginMethods]);

  const adapterListClass = classNames("w3a-adapter-list", "w3ajs-socials-adapters", !isExpanded ? " w3a-adapter-list--shrink" : "");
  const adapterButtonClass = classNames("w3a-button-expand", "w3ajs-button-expand", isExpanded ? "w3a-button--rotate" : "");
  const adapterExpandText = isExpanded ? t("modal.social.view-less") : t("modal.social.view-more");
  const loginMethodsCount = Object.keys(socialLoginsConfig.loginMethods).length + 1;

  const restrictedLoginMethods: string[] = [
    AUTH_CONNECTION.CUSTOM,
    AUTH_CONNECTION.SMS_PASSWORDLESS,
    AUTH_CONNECTION.EMAIL_PASSWORDLESS,
    AUTH_CONNECTION.PASSKEYS,
    AUTH_CONNECTION.TELEGRAM,
    AUTH_CONNECTION.AUTHENTICATOR,
  ];

  return (
    <div className="w3ajs-social-logins w3a-group">
      {/* <div className="w3a-group__title">{t("modal.social.continue")}</div> */}
      <ul className={adapterListClass}>
        {Object.keys(socialLoginsConfig.loginMethods).map((method) => {
          const socialLoginConfig = socialLoginsConfig.loginMethods[method as AUTH_CONNECTION_TYPE];
          const name = capitalizeFirstLetter(socialLoginConfig.name || method);
          const orderIndex = socialLoginsConfig.loginMethodsOrder.indexOf(method) + 1;
          const order = orderIndex || Object.keys(socialLoginsConfig.loginMethods).length + 1;

          const isMainOption = socialLoginConfig.mainOption;
          const isPrimaryBtn = socialLoginsConfig?.uiConfig?.primaryButton === "socialLogin" && order === 1;

          const providerIcon = getProviderIcon(method, isDark, isPrimaryBtn);

          if (socialLoginConfig.showOnModal === false || restrictedLoginMethods.includes(method)) {
            return null;
          }

          const loginMethodSpan = classNames(
            "w3a-adapter-item",
            socialLoginsConfig?.uiConfig?.loginGridCol === 2 ? "w3a--col-span-3" : "w3a--col-span-2"
          );

          if (isMainOption || order === 1) {
            return (
              <li className="w3a-adapter-item w3a--col-span-6" key={method} style={{ order }}>
                <Button
                  variant="secondary"
                  onClick={() =>
                    handleSocialLoginClick({
                      connector: socialLoginsConfig.connector,
                      loginParams: {
                        authConnection: method,
                        name: socialLoginConfig.name,
                        authConnectionId: socialLoginConfig.authConnectionId,
                        groupedAuthConnectionId: socialLoginConfig.groupedAuthConnectionId,
                        extraLoginOptions: socialLoginConfig.extraLoginOptions,
                        login_hint: "",
                      },
                    })
                  }
                  className="w3a--w-full"
                  title={name}
                >
                  {providerIcon}
                  <p className="w3a--ml-2">{t("modal.social.continueCustom", { adapter: name })}</p>
                </Button>
              </li>
            );
          }
          return (
            <li className={loginMethodSpan} key={method} style={{ order: order + loginMethodsCount }}>
              <Button
                variant="secondary"
                onClick={() =>
                  handleSocialLoginClick({
                    connector: socialLoginsConfig.connector,
                    loginParams: {
                      authConnection: method,
                      name: socialLoginConfig.name,
                      authConnectionId: socialLoginConfig.authConnectionId,
                      groupedAuthConnectionId: socialLoginConfig.groupedAuthConnectionId,
                      login_hint: "",
                    },
                  })
                }
                className="w3a--w-full"
                title={name}
              >
                {providerIcon}
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="w3a-social__policy">{t("modal.social.policy")}</div>
      {canShowMore && (
        <div className="w3a--text-right">
          <button type="button" className={adapterButtonClass} onClick={expandClickHandler}>
            <span className="w3ajs-button-expand-text">{adapterExpandText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
