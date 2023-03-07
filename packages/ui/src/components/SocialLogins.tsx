import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import classNames from "classnames";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { capitalizeFirstLetter } from "../config";
import { ThemedContext } from "../context/ThemeContext";
import { SocialLoginsConfig } from "../interfaces";
import Image from "./Image";

// const hasLightIcons = ["apple", "github"];

interface SocialLoginProps {
  socialLoginsConfig: SocialLoginsConfig;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string; name: string } }) => void;
}

export default function SocialLogins(props: SocialLoginProps) {
  const [canShowMore, setCanShowMore] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    socialLoginsConfig = {
      loginMethods: {},
      loginMethodsOrder: [],
      adapter: "",
      uiConfig: {},
    },
    handleSocialLoginClick,
  } = props;
  const { isDark } = useContext(ThemedContext);

  const [t] = useTranslation();

  // Too small a function to use `useCallback`
  const expandClickHandler = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const maxOptions = Object.keys(socialLoginsConfig.loginMethods).filter((loginMethodKey) => {
      return socialLoginsConfig.loginMethods[loginMethodKey].showOnModal;
    });
    setCanShowMore(maxOptions.length > 4);
  }, [socialLoginsConfig.loginMethods]);

  const adapterListClass = classNames("w3a-adapter-list", "w3ajs-socials-adapters", !isExpanded ? " w3a-adapter-list--shrink" : "");
  const adapterButtonClass = classNames("w3a-button-expand", "w3ajs-button-expand", isExpanded ? "w3a-button--rotate" : "");
  const adapterExpandText = isExpanded ? t("modal.social.view-less") : t("modal.social.view-more");
  const loginMethodsCount = Object.keys(socialLoginsConfig.loginMethods).length + 1;

  const restrictedLoginMethods: string[] = [
    LOGIN_PROVIDER.WEBAUTHN,
    LOGIN_PROVIDER.JWT,
    LOGIN_PROVIDER.SMS_PASSWORDLESS,
    LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
  ];

  return (
    <div className="w3ajs-social-logins w3a-group">
      {/* <div className="w3a-group__title">{t("modal.social.continue")}</div> */}
      <ul className={adapterListClass}>
        {Object.keys(socialLoginsConfig.loginMethods).map((method) => {
          const name = capitalizeFirstLetter(socialLoginsConfig.loginMethods[method].name || method);
          const orderIndex = socialLoginsConfig.loginMethodsOrder.indexOf(method) + 1;
          const order = orderIndex || Object.keys(socialLoginsConfig.loginMethods).length + 1;

          const isMainOption = socialLoginsConfig.loginMethods[method].mainOption;
          const isPrimaryBtn = socialLoginsConfig?.uiConfig?.primaryButton === "socialLogin" && order === 1;

          const imageId = `login-${method}${isDark || isPrimaryBtn ? "-light" : "-dark"}`;
          const hoverId = `login-${method}-active`;
          const hoverImage = method === LOGIN_PROVIDER.APPLE || method === LOGIN_PROVIDER.GITHUB ? imageId : hoverId;
          const providerIcon = <Image width="20" imageId={imageId} hoverImageId={hoverImage} isButton />;

          if (socialLoginsConfig.loginMethods[method].showOnModal === false || restrictedLoginMethods.includes(method)) {
            return null;
          }

          const loginMethodSpan = classNames("w3a-adapter-item", socialLoginsConfig?.uiConfig?.loginGridCol === 2 ? "col-span-3" : "col-span-2");

          if (isMainOption || order === 1) {
            return (
              <li className="col-span-6 w3a-adapter-item" key={method} style={{ order }}>
                <button
                  type="button"
                  onClick={() =>
                    handleSocialLoginClick({
                      adapter: socialLoginsConfig.adapter,
                      loginParams: { loginProvider: method, name, login_hint: "" },
                    })
                  }
                  className={`w3a-button ${isPrimaryBtn ? "w3a-button--primary" : ""} w3a-button--login h-12 w-full`}
                  title={name}
                >
                  {providerIcon}
                  <p className="ml-2">
                    {t("modal.social.continue")}
                    <span className="w3a-button__adapter">{name}</span>
                  </p>
                </button>
              </li>
            );
          }
          return (
            <li className={loginMethodSpan} key={method} style={{ order: order + loginMethodsCount }}>
              <button
                type="button"
                onClick={() =>
                  handleSocialLoginClick({
                    adapter: socialLoginsConfig.adapter,
                    loginParams: { loginProvider: method, name, login_hint: "" },
                  })
                }
                className="w-full w3a-button w3a-button--login"
                title={name}
              >
                {providerIcon}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="w3a-social__policy">{t("modal.social.policy")}</div>
      {canShowMore && (
        <div className="text-right">
          <button type="button" className={adapterButtonClass} onClick={expandClickHandler}>
            <span className="w3ajs-button-expand-text">{adapterExpandText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
