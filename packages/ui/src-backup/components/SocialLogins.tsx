import classNames from "classnames";
import { useState } from "react";

import AllImages from "../../assets";

interface SocialLoginProps {
  isDark: boolean;
}

export default function SocialLogins(props: SocialLoginProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { isDark } = props;
  const expandIcon = AllImages[`expand${isDark ? "-light" : ""}`].image;

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
    <div className="w3ajs-social-logins w3a-group w3a-group--social-hidden">
      <h6 className="w3a-group__title">CONTINUE WITH</h6>
      <ul className={adapterListClass}></ul>
      <button className={adapterButtonClass} style={{ display: "none" }} onClick={clickHandler}>
        ${expandIcon}
        <span className="w3ajs-button-expand-text">{adapterExpandText}</span>
      </button>
    </div>
  );
}
