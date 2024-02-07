import { post } from "@toruslabs/http-helpers";
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import { jwtDecode } from "jwt-decode";

import { ChainNamespaceType } from "../chain/IChainInterface";
import { authServer } from "../constants";
import log from "../loglevel";
import { storageAvailable } from "../utils";
import { FarcasterSIWEMessage, FarcasterVerifyResult, VerifyFarcasterLoginParams } from ".";

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

export const signChallenge = async (payload: Record<string, string | number>, chainNamespace: ChainNamespaceType): Promise<string> => {
  const t = chainNamespace === "solana" ? "sip99" : "eip191";
  const header = {
    t,
  };

  const network = chainNamespace === "solana" ? "solana" : "ethereum";
  const data = {
    payload,
    header,
    network,
  };
  const res = await post<{ success: boolean; challenge: string }>(`${authServer}/siww/get`, data);
  if (!res.success) {
    throw new Error("Failed to authenticate user, Please reach out to Web3Auth Support team");
  }

  return res.challenge;
};

export const verifySignedChallenge = async (
  chainNamespace: ChainNamespaceType,
  signedMessage: string,
  challenge: string,
  issuer: string,
  sessionTime: number,
  clientId?: string,
  web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE
): Promise<string> => {
  const t = chainNamespace === "solana" ? "sip99" : "eip191";
  const sigData = {
    signature: {
      s: signedMessage,
      t,
    },
    message: challenge,
    issuer,
    audience: typeof window.location !== "undefined" ? window.location.hostname : "com://reactnative",
    timeout: sessionTime,
  };

  const idTokenRes = await post<{ success: boolean; token: string; error?: string }>(`${authServer}/siww/verify`, sigData, {
    headers: {
      client_id: clientId,
      wallet_provider: issuer,
      web3auth_network: web3AuthNetwork,
    },
  });
  if (!idTokenRes.success) {
    log.error("Failed to authenticate user, ,message verification failed", idTokenRes.error);
    throw new Error("Failed to authenticate user, ,message verification failed");
  }
  return idTokenRes.token;
};

export const getSiwfNonce = async (sessionId: string, domain: string, expirationTime: string): Promise<string> => {
  const body = { sessionId, domain, expirationTime };
  const siwfGetResponse = await post<{ success: boolean; nonce?: string; error?: string }>(`${authServer}/siwf/get`, body);
  if (!siwfGetResponse.success) {
    throw new Error(siwfGetResponse.error);
  }
  return siwfGetResponse.nonce;
};

export const verifyFarcasterLogin = async (params: VerifyFarcasterLoginParams, clientId: string, network: string): Promise<FarcasterVerifyResult> => {
  const body = params;
  const idTokenRes = await post<{ success: boolean; token?: string; fid?: string; userinfo: FarcasterSIWEMessage; error?: string }>(
    `${authServer}/siwf/verify`,
    body,
    {
      headers: {
        client_id: clientId,
        wallet_provider: params.issuer,
        web3auth_network: network,
      },
    }
  );
  if (!idTokenRes.success) {
    log.error("Failed to authenticate user, ,message verification failed", idTokenRes.error);
    throw new Error("Failed to authenticate user, ,message verification failed");
  }

  return {
    token: idTokenRes.token,
    fid: idTokenRes.fid,
    userinfo: idTokenRes.userinfo,
  };
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
