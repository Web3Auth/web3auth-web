import { LOGIN_PROVIDER, OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const PASSWORDLESS_BACKEND: Record<OPENLOGIN_NETWORK_TYPE, string> = {
  mainnet: "https://admin.openlogin.com",
  cyan: "https://admin.openlogin.com",
  aqua: "https://admin.openlogin.com",
  celeste: "https://admin.openlogin.com",
  sk_testnet: "https://lrc.admin.openlogin.com",
  testnet: "https://lrc.admin.openlogin.com",
  development: "https://lrc.admin.openlogin.com",
};

export const OPENLOGIN_PROVIDERS = Object.values(LOGIN_PROVIDER).filter((x) => x !== LOGIN_PROVIDER.WEBAUTHN && x !== LOGIN_PROVIDER.JWT);

export const OPENLOGIN_PROVIDERS_NAMES = OPENLOGIN_PROVIDERS.reduce((acc, x) => {
  if (x === "email_passwordless") acc[x] = "Email";
  else if (x === "sms_passwordless") acc[x] = "Mobile";
  else acc[x] = capitalizeFirstLetter(x);
  return acc;
}, {});
