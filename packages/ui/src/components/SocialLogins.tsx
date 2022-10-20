import classNames from "classnames";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ThemedContext } from "../context/ThemeContext";
import { SocialLoginsConfig } from "../interfaces";
import Icon from "./Icon";
import Image from "./Image";

const hasLightIcons = ["apple", "github"];

interface SocialLoginProps {
  socialLoginsConfig: SocialLoginsConfig;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string } }) => void;
}

export default function SocialLogins(props: SocialLoginProps) {
  const [canShowMore, setCanShowMore] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    socialLoginsConfig = {
      loginMethods: {},
      loginMethodsOrder: [],
      adapter: "",
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
    setCanShowMore(maxOptions.length > 5);
  }, [socialLoginsConfig.loginMethods]);

  const adapterListClass = classNames("w3a-adapter-list", "w3ajs-socials-adapters", !isExpanded ? " w3a-adapter-list--shrink" : "");
  const adapterButtonClass = classNames("w3a-button-expand", "w3ajs-button-expand", isExpanded ? "w3a-button--rotate" : "");
  const adapterExpandText = isExpanded ? t("modal.social.view-less") : t("modal.social.view-more");

  return (
    <div className="w3ajs-social-logins w3a-group">
      <div className="w3a-group__title">{t("modal.social.continue")}</div>
      <ul className={adapterListClass}>
        {Object.keys(socialLoginsConfig.loginMethods).map((method) => {
          const providerIcon = <Image imageId={`login-${method}${isDark && hasLightIcons.includes(method) ? "-light" : ""}`} />;

          if (
            socialLoginsConfig.loginMethods[method].showOnModal === false ||
            method === "webauthn" ||
            method === "jwt" ||
            method === "email_passwordless"
          ) {
            return null;
          }
          const orderIndex = socialLoginsConfig.loginMethodsOrder.indexOf(method) + 1;
          const order = orderIndex || Object.keys(socialLoginsConfig.loginMethods).length + 1;

          return (
            <li className="w3a-adapter-item" key={method} style={{ order }}>
              <button
                type="button"
                onClick={() => handleSocialLoginClick({ adapter: socialLoginsConfig.adapter, loginParams: { loginProvider: method } })}
                className="w3a-button w3a-button--icon"
              >
                {providerIcon}
              </button>
            </li>
          );
        })}
      </ul>
      {canShowMore && (
        <button type="button" className={adapterButtonClass} style={{ display: "flex" }} onClick={expandClickHandler}>
          <Icon iconName={`expand${isDark ? "-light" : ""}`} />
          <span className="w3ajs-button-expand-text">{adapterExpandText}</span>
        </button>
      )}
    </div>
  );
}
