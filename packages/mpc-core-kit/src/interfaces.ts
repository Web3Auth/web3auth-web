import { KeyDetails, ShareStore } from "@tkey/common-types";
import type { AGGREGATE_VERIFIER_TYPE, LoginWindowResponse, SubVerifierDetails, TorusVerifierResponse } from "@toruslabs/customauth";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import BN from "bn.js";

import { USER_PATH, WEB3AUTH_NETWORK } from "./constants";

export interface BaseLoginParams {
  // offset in seconds
  serverTimeOffset?: number;
}

export interface SubVerifierDetailsParams extends BaseLoginParams {
  subVerifierDetails: SubVerifierDetails;
}

export interface AggregateVerifierLoginParams extends BaseLoginParams {
  aggregateVerifierIdentifier?: string;
  aggregateVerifierType?: AGGREGATE_VERIFIER_TYPE;
  subVerifierDetailsArray?: SubVerifierDetails[];
}

export type LoginParams = SubVerifierDetailsParams & AggregateVerifierLoginParams;
export type UserInfo = TorusVerifierResponse & LoginWindowResponse;

export interface IWeb3Auth {
  provider: SafeEventEmitterProvider | null;
  init(): void;
  connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null>;
  getUserInfo(): UserInfo;
  inputBackupShare(shareMnemonic: string): Promise<void>;
  exportBackupShare(): Promise<string>;
  addSecurityQuestionShare(question: string, password: string): Promise<void>;
  changeSecurityQuestionShare(question: string, password: string): Promise<void>;
  recoverSecurityQuestionShare(question: string, password: string): Promise<void>;
  deleteSecurityQuestionShare(question: string): Promise<void>;
  getKeyDetails(): KeyDetails;
  commitChanges(): Promise<void>;
  logout(): Promise<void>;
}

export type WEB3AUTH_NETWORK_TYPE = (typeof WEB3AUTH_NETWORK)[keyof typeof WEB3AUTH_NETWORK];

export type USER_PATH_TYPE = (typeof USER_PATH)[keyof typeof USER_PATH];

export interface Web3AuthOptions {
  web3AuthClientId: string;

  chainConfig?: CustomChainConfig;

  manualSync?: boolean;

  baseUrl?: string;

  web3AuthNetwork?: WEB3AUTH_NETWORK_TYPE;

  tssImportUrl?: string;

  storageKey?: "session" | "local";

  // default 86400.
  sessionTime?: number;
}

export interface Web3AuthState {
  oAuthKey?: string;
  signatures?: string[];
  userInfo?: UserInfo;
  tssNonce?: number;
  tssShare2?: BN;
  tssShare2Index?: number;
  tssPubKey?: Buffer;
  factorKey?: BN;
}

export type FactorKeyCloudMetadata = {
  share: ShareStore;
  tssShare: BN;
  tssIndex: number;
};

export interface SessionData {
  oAuthKey: string;
  factorKey: string;
  tssNonce: number;
  tssShare: string;
  tssShareIndex: number;
  tssPubKey: string;
  signatures: string[];
  userInfo: UserInfo;
}

export interface TkeyLocalStoreData {
  factorKey: string;
}
