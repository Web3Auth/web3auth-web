import { LoginMethodConfig } from "@web3auth/base";
import classNames from "classnames";
import React, { useState } from "react";

import AllImages from "../../assets";
const hasLightIcons = ["apple", "github"];

interface SocialLoginProps {
  isDark: boolean;
  loginMethods: LoginMethodConfig;
}

export default function SocialLogins(props: SocialLoginProps) {
  const { isDark, loginMethods = {} } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  // const { isDark } = props;
  // const expandIcon = AllImages[`expand${isDark ? "-light" : ""}`].image;

  // Too small a function to use `useCallback`
  const clickHandler = () => {
    setIsExpanded(!isExpanded);
  };

  const adapterListClass = classNames("w3a-adapter-list", "w3ajs-socials-adapters", {
    " w3a-adapter-list--shrink": isExpanded,
  });
  const adapterButtonClass = classNames("w3a-button-expand", "w3ajs-button-expand", {
    "w3a-button--rotate": !isExpanded,
  });
  const adapterExpandText = isExpanded ? "View less options" : "View more options";

  return (
    <div className="w3ajs-social-logins w3a-group">
      <h6 className="w3a-group__title">CONTINUE WITH</h6>
      <ul className={adapterListClass}>
        {Object.keys(loginMethods).map((method) => {
          const providerIcon = AllImages[`login-${method}${isDark && hasLightIcons.includes(method) ? "-light" : ""}`].image;

          return (
            <li className="w3a-adapter-item">
              {/* TODO: add icon */}
              <button className="w3a-button w3a-button--icon">{method.substring(0, 2)}</button>
            </li>
          );
        })}
      </ul>
      <button className={adapterButtonClass} style={{ display: "none" }} onClick={clickHandler}>
        {/* ${expandIcon} */}
        <span className="w3ajs-button-expand-text">{adapterExpandText}</span>
      </button>
    </div>
  );
}
