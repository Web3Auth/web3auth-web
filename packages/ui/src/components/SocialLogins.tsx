import classNames from "classnames";
import { useContext, useState } from "react";

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
  const {
    socialLoginsConfig = {
      loginMethods: {},
      loginMethodsOrder: [],
      adapter: "",
    },
    handleSocialLoginClick,
  } = props;
  const { isDark } = useContext(ThemedContext);

  const [isExpanded, setIsExpanded] = useState(false);

  // Too small a function to use `useCallback`
  const expandClickHandler = () => {
    setIsExpanded(!isExpanded);
  };

  const adapterListClass = classNames("w3a-adapter-list", "w3ajs-socials-adapters", !isExpanded ? " w3a-adapter-list--shrink" : "");
  const adapterButtonClass = classNames("w3a-button-expand", "w3ajs-button-expand", isExpanded ? "w3a-button--rotate" : "");
  const adapterExpandText = isExpanded ? "View less options" : "View more options";

  return (
    <div className="w3ajs-social-logins w3a-group">
      <h6 className="w3a-group__title">CONTINUE WITH</h6>
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
      <button
        type="button"
        className={adapterButtonClass}
        style={{ display: Object.keys(socialLoginsConfig.loginMethods).length > 5 ? "flex" : "none" }}
        onClick={expandClickHandler}
      >
        <Icon iconName={`expand${isDark ? "-light" : ""}`} />
        <span className="w3ajs-button-expand-text">{adapterExpandText}</span>
      </button>
    </div>
  );
}
