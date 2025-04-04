import { AUTH_CONNECTION } from "@web3auth/auth";

import { cn } from "../../../utils";
import Image from "../../Image";
import { ButtonSocialProps } from "./ButtonSocial.type";

function getProviderIcon(method: string, isDark: boolean, isPrimaryBtn: boolean) {
  const imageId =
    method === AUTH_CONNECTION.TWITTER ? `login-twitter-x${isDark ? "-light" : "-dark"}` : `login-${method}${isDark ? "-light" : "-dark"}`;
  const hoverId =
    method === AUTH_CONNECTION.APPLE || method === AUTH_CONNECTION.GITHUB || method === AUTH_CONNECTION.TWITTER ? imageId : `login-${method}-active`;
  if (isPrimaryBtn) {
    return <Image width="20" imageId={hoverId} hoverImageId={hoverId} isButton />;
  }
  return <Image width="20" imageId={imageId} hoverImageId={hoverId} />;
}

function SocialLoginButton(props: ButtonSocialProps) {
  const { text, showIcon, showText, method, isDark, isPrimaryBtn, onClick, children, btnStyle, buttonRadius = "pill" } = props;
  return (
    <button
      type="button"
      onClick={(e) => onClick && onClick(e)}
      className={cn("w3a--btn", btnStyle, {
        "w3a--rounded-full": buttonRadius === "pill",
        "w3a--rounded-lg": buttonRadius === "rounded",
        "w3a--rounded-none": buttonRadius === "square",
      })}
    >
      {showIcon && getProviderIcon(method, isDark, isPrimaryBtn)}
      {showText && <p className="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">{text}</p>}
      {children}
    </button>
  );
}

export default SocialLoginButton;
