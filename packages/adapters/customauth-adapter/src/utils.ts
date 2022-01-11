import {
  LoginWindowResponse,
  RedirectResult,
  storageAvailable,
  TORUS_METHOD,
  TorusAggregateLoginResponse,
  TorusHybridAggregateLoginResponse,
  TorusKeyPub,
  TorusLoginResponse,
  TorusVerifierResponse,
} from "@toruslabs/customauth";

import { CustomAuthResult } from "./interface";

export function parseCustomAuthResult(redirectResult: RedirectResult): CustomAuthResult {
  const { result, method } = redirectResult;
  let userInfo: TorusVerifierResponse & LoginWindowResponse;
  let publicAddress: string;
  let privateKey: string;
  let pubKey: TorusKeyPub["pubKey"];
  if (method === TORUS_METHOD.TRIGGER_LOGIN) {
    ({ userInfo, publicAddress, privateKey, pubKey } = result as TorusLoginResponse);
  } else if (method === TORUS_METHOD.TRIGGER_AGGREGATE_LOGIN) {
    const { userInfo: aggregateUserInfo } = result as TorusAggregateLoginResponse;
    ({ publicAddress, privateKey, pubKey } = result as TorusAggregateLoginResponse);
    [userInfo] = aggregateUserInfo;
  } else if (method === TORUS_METHOD.TRIGGER_AGGREGATE_HYBRID_LOGIN) {
    const { singleLogin, aggregateLogins } = result as TorusHybridAggregateLoginResponse;
    ({ userInfo } = singleLogin);
    [{ publicAddress, privateKey, pubKey }] = aggregateLogins;
  } else {
    throw new Error("Unsupported method type");
  }
  return {
    publicAddress,
    privateKey: privateKey?.padStart(64, "0") || "",
    ...userInfo,
    pubKey,
  };
}

export const sessionStorageAvailable = storageAvailable("sessionStorage");
