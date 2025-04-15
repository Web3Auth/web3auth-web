import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE, BUILD_ENV, BUILD_ENV_TYPE } from "@web3auth/auth";

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const restrictedLoginMethods: Set<AUTH_CONNECTION_TYPE> = new Set([
  AUTH_CONNECTION.CUSTOM,
  AUTH_CONNECTION.PASSKEYS,
  AUTH_CONNECTION.TELEGRAM,
  AUTH_CONNECTION.AUTHENTICATOR,
]);
export const AUTH_PROVIDERS = Object.values(AUTH_CONNECTION).filter((x) => !restrictedLoginMethods.has(x));

export const AUTH_PROVIDERS_NAMES = AUTH_PROVIDERS.reduce(
  (acc, x) => {
    if (x === "email_passwordless") acc[x] = "Email";
    else if (x === "sms_passwordless") acc[x] = "Mobile";
    else acc[x] = capitalizeFirstLetter(x);
    return acc;
  },
  {} as Record<AUTH_CONNECTION_TYPE, string>
);

export const PASSWORDLESS_BUILD_ENV_MAP: Record<BUILD_ENV_TYPE, string> = {
  // [BUILD_ENV.DEVELOPMENT]: "http://localhost:3041/passwordless-service",
  [BUILD_ENV.DEVELOPMENT]: "https://api-develop.web3auth.io/passwordless-service",
  [BUILD_ENV.STAGING]: "https://api.web3auth.io/passwordless-service",
  [BUILD_ENV.PRODUCTION]: "https://api.web3auth.io/passwordless-service",
  [BUILD_ENV.TESTING]: "https://api-develop.web3auth.io/passwordless-service",
};

export const CAPTCHA_SITE_KEY = "d5f0c15c-eeda-4f9c-934a-d8e0348e83b2";
