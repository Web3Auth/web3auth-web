import { jwtDecode } from "jwt-decode";

import { storageAvailable } from "../utils";

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
