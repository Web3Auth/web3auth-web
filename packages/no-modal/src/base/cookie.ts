import type { IStorage } from "@web3auth/auth";

import { WEB3AUTH_STATE_STORAGE_KEY } from "./constants";
import { deserialize } from "./deserialize";
import type { IWeb3AuthState } from "./interfaces";

export const cookieStorage = (options?: { expiry?: number }) =>
  ({
    getItem(key: string) {
      if (typeof window === "undefined") return null;
      const value = parseCookie(document.cookie, key);
      return value ?? null;
    },
    setItem(key: string, value: string) {
      if (typeof window === "undefined") return;
      let cookieString = `${key}=${value};path=/;samesite=Lax`;

      if (options?.expiry && typeof options.expiry === "number") cookieString += `; expires=${new Date(Date.now() + options.expiry).toUTCString()}`;
      if (process.env.NODE_ENV === "production") cookieString += "; secure";
      document.cookie = cookieString;
    },
    removeItem(key: string) {
      if (typeof window === "undefined") return;
      document.cookie = `${key}=;max-age=-1;path=/`;
    },
  }) satisfies IStorage;

export function cookieToInitialState(cookie?: string | null) {
  if (!cookie) return undefined;
  const parsed = parseCookie(cookie, WEB3AUTH_STATE_STORAGE_KEY);
  if (!parsed) return undefined;
  return deserialize<IWeb3AuthState>(parsed);
}

export function parseCookie(cookie: string, key: string) {
  const keyValue = cookie.split("; ").find((x) => x.startsWith(`${key}=`));
  if (!keyValue) return undefined;
  return keyValue.substring(key.length + 1);
}
