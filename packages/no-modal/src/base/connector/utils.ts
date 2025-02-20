import { jwtDecode } from "jwt-decode";

export function storageAvailable(type: "sessionStorage" | "localStorage"): boolean {
  let storageExists = false;
  let storageLength = 0;
  let storage: Storage;
  try {
    storage = window[type];
    storageExists = true;
    storageLength = storage.length;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (err: unknown) {
    const error = err as DOMException;
    return !!(
      error &&
      // everything except Firefox
      (error.code === 22 ||
        // Firefox
        error.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        error.name === "QuotaExceededError" ||
        // Firefox
        error.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      storageExists &&
      storageLength !== 0
    );
  }
}

export const checkIfTokenIsExpired = (token: string) => {
  const decoded = jwtDecode<{ exp: number }>(token);
  if (!decoded.exp) {
    return true;
  }
  if (decoded.exp < Math.floor(Date.now() / 1000)) {
    return true;
  }
  return false;
};

export const getSavedToken = (userAddress: string, issuer: string) => {
  if (storageAvailable("localStorage")) {
    return localStorage.getItem(`${userAddress.toLowerCase()}_${issuer}`);
  }
  return null;
};

export const saveToken = (userAddress: string, issuer: string, token: string) => {
  if (storageAvailable("localStorage")) {
    return localStorage.setItem(`${userAddress.toLowerCase()}_${issuer}`, token);
  }
  return null;
};

export const clearToken = (userAddress: string, issuer: string) => {
  if (storageAvailable("localStorage")) {
    return localStorage.removeItem(`${userAddress.toLowerCase()}_${issuer}`);
  }
  return null;
};
