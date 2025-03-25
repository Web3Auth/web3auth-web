import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const restrictedLoginMethods: Set<AUTH_CONNECTION_TYPE> = new Set([
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
