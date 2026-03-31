import { WEB3AUTH_STATE_STORAGE_KEY } from "./constants";
import { deserialize } from "./deserialize";
import type { IWeb3AuthState } from "./interfaces";

export function cookieToWeb3AuthState(cookie?: string | null) {
  if (!cookie) return undefined;
  const parsed = parseCookie(cookie, WEB3AUTH_STATE_STORAGE_KEY);
  if (!parsed) return undefined;
  return deserialize<IWeb3AuthState>(parsed);
}

export function parseCookie(cookie: string, key: string) {
  const keyValue = cookie.split("; ").find((x) => x.startsWith(`${key}=`));
  if (!keyValue) return undefined;
  const value = keyValue.substring(key.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
