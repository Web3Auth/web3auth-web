import { LOGIN_PROVIDER } from "@web3auth/auth";
import { JSX } from "solid-js";

import { cn } from "../../utils/common";
import Image from "../Image/Image";
export interface SocialLoginButtonProps {
  text?: string;
  showIcon?: boolean;
  showText?: boolean;
  method?: string;
  isDark?: boolean;
  isPrimaryBtn?: boolean;
  onClick?: (e: Event) => void;
  children?: JSX.Element[] | JSX.Element;
  btnStyle?: string;
}

function getProviderIcon(method: string, isDark: boolean, isPrimaryBtn: boolean) {
  const imageId =
    method === LOGIN_PROVIDER.TWITTER ? `login-twitter-x${isDark ? "-light" : "-dark"}` : `login-${method}${isDark ? "-light" : "-dark"}`;
  const hoverId =
    method === LOGIN_PROVIDER.APPLE || method === LOGIN_PROVIDER.GITHUB || method === LOGIN_PROVIDER.TWITTER ? imageId : `login-${method}-active`;
  if (isPrimaryBtn) {
    return <Image width="20" imageId={hoverId} hoverImageId={hoverId} isButton />;
  }
  return <Image width="20" imageId={imageId} hoverImageId={hoverId} />;
}

const SocialLoginButton = (props: SocialLoginButtonProps) => {
  return (
    <button type="button" onClick={(e) => props.onClick?.(e)} class={cn("w3a--btn", props.btnStyle)}>
      {props.showIcon && getProviderIcon(props.method, props.isDark, props.isPrimaryBtn)}
      {props.showText && <p class="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">{props.text}</p>}
      {props?.children}
    </button>
  );
};

export default SocialLoginButton;
