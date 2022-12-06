import { LOGIN_PROVIDER } from "@toruslabs/openlogin";

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const OPENLOGIN_PROVIDERS = Object.values(LOGIN_PROVIDER).filter((x) => x !== LOGIN_PROVIDER.WEBAUTHN && x !== LOGIN_PROVIDER.JWT);

export const OPENLOGIN_PROVIDERS_NAMES = OPENLOGIN_PROVIDERS.reduce((acc, x) => {
  acc[x] = x === "email_passwordless" ? "Email" : capitalizeFirstLetter(x);
  return acc;
}, {});
