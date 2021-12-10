import { storageAvailable, TORUS_METHOD } from "@toruslabs/customauth";

import {
  LoginWindowResponse,
  RedirectResult,
  TorusAggregateLoginResponse,
  TorusDirectAuthResult,
  TorusHybridAggregateLoginResponse,
  TorusKey,
  TorusKeyPub,
  TorusLoginResponse,
  TorusVerifierResponse,
} from "./interface";
export function parseDirectAuthResult(redirectResult: RedirectResult): TorusDirectAuthResult {
  const { result, method } = redirectResult;
  let userInfo: TorusVerifierResponse & LoginWindowResponse;
  let publicAddress: string;
  let privateKey: string;
  let metadataNonce: string;
  let pubKey: TorusKeyPub["pubKey"];
  let typeOfUser: TorusKey["typeOfUser"];
  if (method === TORUS_METHOD.TRIGGER_LOGIN) {
    ({ userInfo, publicAddress, privateKey, metadataNonce, pubKey, typeOfUser } = result as TorusLoginResponse);
  } else if (method === TORUS_METHOD.TRIGGER_AGGREGATE_LOGIN) {
    const { userInfo: aggregateUserInfo } = result as TorusAggregateLoginResponse;
    ({ publicAddress, privateKey, metadataNonce, pubKey, typeOfUser } = result as TorusAggregateLoginResponse);
    [userInfo] = aggregateUserInfo;
  } else if (method === TORUS_METHOD.TRIGGER_AGGREGATE_HYBRID_LOGIN) {
    const { singleLogin, aggregateLogins } = result as TorusHybridAggregateLoginResponse;
    ({ userInfo } = singleLogin);
    [{ publicAddress, privateKey, metadataNonce, pubKey, typeOfUser }] = aggregateLogins;
  } else {
    throw new Error("Unsupported method type");
  }
  return {
    publicAddress,
    privateKey: privateKey?.padStart(64, "0") || "",
    metadataNonce,
    ...userInfo,
    pubKey,
    typeOfUser,
  };
}

export function parseTriggerLoginResult(loginResult: TorusLoginResponse): TorusDirectAuthResult {
  return {
    ...loginResult.userInfo,
    privateKey: loginResult.privateKey,
    publicAddress: loginResult.publicAddress,
    pubKey: loginResult.pubKey,
    typeOfUser: loginResult.typeOfUser,
    metadataNonce: loginResult.metadataNonce,
  };
}

export const sessionStorageAvailable = storageAvailable("sessionStorage");
