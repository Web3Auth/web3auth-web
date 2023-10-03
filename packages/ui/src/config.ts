import { LOGIN_PROVIDER, LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin-utils";

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const OPENLOGIN_PROVIDERS = Object.values(LOGIN_PROVIDER).filter((x) => x !== LOGIN_PROVIDER.WEBAUTHN && x !== LOGIN_PROVIDER.JWT);

export const OPENLOGIN_PROVIDERS_NAMES = OPENLOGIN_PROVIDERS.reduce(
  (acc, x) => {
    if (x === "email_passwordless") acc[x] = "Email";
    else if (x === "sms_passwordless") acc[x] = "Mobile";
    else acc[x] = capitalizeFirstLetter(x);
    return acc;
  },
  {} as Record<LOGIN_PROVIDER_TYPE, string>
);
