import type OpenLogin from "@toruslabs/openlogin";
import { LoginMethodConfig } from "@web3auth/base";
import log from "loglevel";

export const LOGIN_PROVIDER = {
  GOOGLE: "google",
  FACEBOOK: "facebook",
  REDDIT: "reddit",
  DISCORD: "discord",
  TWITCH: "twitch",
  APPLE: "apple",
  LINE: "line",
  GITHUB: "github",
  KAKAO: "kakao",
  LINKEDIN: "linkedin",
  TWITTER: "twitter",
  WEIBO: "weibo",
  WECHAT: "wechat",
  EMAIL_PASSWORDLESS: "email_passwordless",
} as const;

export const OPENLOGIN_PROVIDERS = [
  LOGIN_PROVIDER.GOOGLE,
  LOGIN_PROVIDER.FACEBOOK,
  LOGIN_PROVIDER.TWITTER,
  LOGIN_PROVIDER.REDDIT,
  LOGIN_PROVIDER.DISCORD,
  LOGIN_PROVIDER.TWITCH,
  LOGIN_PROVIDER.APPLE,
  LOGIN_PROVIDER.LINE,
  LOGIN_PROVIDER.GITHUB,
  LOGIN_PROVIDER.KAKAO,
  LOGIN_PROVIDER.LINKEDIN,
  LOGIN_PROVIDER.WEIBO,
  LOGIN_PROVIDER.WECHAT,
  LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
];

export const mergeOpenLoginConfig = (openloginInstance: OpenLogin, loginMethodsConfig: LoginMethodConfig = {}): LoginMethodConfig => {
  const finalLoginMethodsConfig: LoginMethodConfig = {};
  OPENLOGIN_PROVIDERS.forEach((loginMethod) => {
    const finalLoginMethodConfig = {
      name: loginMethod,
      showOnMobile: true,
      showOnModal: true,
      showOnDesktop: true,
      ...(openloginInstance.state.loginConfig?.[loginMethod] || {}),
      ...(loginMethodsConfig[loginMethod] || {}),
    };
    finalLoginMethodsConfig[loginMethod] = { ...finalLoginMethodConfig };
    log.debug("OpenLogin login method ui config", finalLoginMethodsConfig);
  });

  return finalLoginMethodsConfig;
};
