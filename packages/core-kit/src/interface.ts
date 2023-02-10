import { SECURITY_QUESTIONS_MODULE_NAME } from "@tkey/security-questions";
import { SHARE_SERIALIZATION_MODULE_NAME } from "@tkey/share-serialization";
import { SHARE_TRANSFER_MODULE_NAME } from "@tkey/share-transfer";
import { WEB_STORAGE_MODULE_NAME } from "@tkey/web-storage";
import type { AGGREGATE_VERIFIER_TYPE, SubVerifierDetails, UX_MODE_TYPE } from "@toruslabs/customauth";
import type { TORUS_NETWORK_TYPE } from "@toruslabs/fetch-node-details";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";

export const WEB_STORAGE_MODULE_KEY = WEB_STORAGE_MODULE_NAME;
export const SECURITY_QUESTIONS_MODULE_KEY = SECURITY_QUESTIONS_MODULE_NAME;
export const SHARE_SERIALIZATION_MODULE_KEY = SHARE_SERIALIZATION_MODULE_NAME;
export const CHROME_EXTENSION_STORAGE_MODULE_KEY = "chromeExtensionStorage";
export const SHARE_TRANSFER_MODULE_KEY = SHARE_TRANSFER_MODULE_NAME;
export const WEBAUTHN_DEVICE_MODULE_KEY = "webauthnDevice";
export const PASSWORD_QUESTION = "what is your password?";
export { UX_MODE } from "@toruslabs/customauth";

export type LoginParams = {
  // offset in seconds
  serverTimeOffset?: number;
  subVerifierDetails?: SubVerifierDetails;
  aggregateVerifierIdentifier?: string;
  aggregateVerifierType?: AGGREGATE_VERIFIER_TYPE;
  subVerifierDetailsArray?: SubVerifierDetails[];
};

export interface IWeb3Auth {
  provider: SafeEventEmitterProvider | null;
  init(): void;
  connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null>;
}

export interface Web3AuthOptions {
  /**
   * Client id for web3auth.
   * You can obtain your client id from the web3auth developer dashboard.
   * You can set any random string for this on localhost.
   */
  clientId: string;
  /**
   * custom chain configuration for chainNamespace
   *
   * @defaultValue mainnet config of provided chainNamespace
   */
  chainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;

  /**
   * Web3Auth Network to use for login
   * @defaultValue mainnet
   */
  web3AuthNetwork?: TORUS_NETWORK_TYPE;

  /**
   * setting to true will enable logs
   *
   * @defaultValue false
   */
  enableLogging?: boolean;

  /**
   * TODO: manual sync tKey
   * @defaultValue false
   */
  manualSync?: boolean;

  baseUrl: string;

  uxMode?: UX_MODE_TYPE;

  singleFactorAuth?: boolean;
}

// SHARE DESCRIPTIONS

export type ModuleShareDescription = { [x: string]: string | boolean | number | string[]; available: boolean; shareIndex: string; module: string };

export type RecoveryShareDescription = { data: string; index: string; indexShort: string; dateAdded: string };
export type ShareSerializationRecoveryShares = {
  [index: string]: RecoveryShareDescription;
};

export type DeviceShareDescription = {
  index: string;
  indexShort: string;
  osDetails: string;
  icon?: string;
  title: string;
  dateAdded: string;
  module: string;
  userAgent: string;
  rawDateAdded?: number;
  customDeviceInfo?: Record<string, string>;
};
export type AllDeviceShares = DeviceShareDescription[];

export type ShareDesciptions = {
  threshold: string;
  tKeyWriteMode: boolean;
  passwordAvailable: boolean;
  deviceShares: AllDeviceShares;
  recoveryShares: ShareSerializationRecoveryShares;
};
