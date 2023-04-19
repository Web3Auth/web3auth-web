import type { TorusSubVerifierInfo } from "@toruslabs/customauth";
import type { TORUS_NETWORK_TYPE } from "@toruslabs/fetch-node-details";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";

export type InitParams = { network: TORUS_NETWORK_TYPE };

export type LoginParams = {
  verifier: string;
  verifierId: string;
  idToken: string;
  subVerifierInfoArray?: TorusSubVerifierInfo[];
  // offset in seconds
  serverTimeOffset?: number;
};

export interface IWeb3Auth {
  provider: SafeEventEmitterProvider | null;
  init(): Promise<void>;
  connect(loginParams: LoginParams): Promise<SafeEventEmitterProvider | null>;
  logout(): Promise<void>;
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
   * setting this to true returns the same key as web sdk (i.e., plug n play key)
   * By default, this sdk returns CoreKitKey
   */
  usePnPKey?: boolean;

  /**
   * How long should a login session last at a minimum in seconds
   *
   * @defaultValue 86400 seconds
   * @remarks Max value of sessionTime can be 7 * 86400 (7 days)
   */
  sessionTime?: number;

  /**
   * setting to "local" will persist social login session accross browser tabs.
   *
   * @defaultValue "local"
   */
  storageKey?: "session" | "local";

  /**
   * Specify a custom storage server url
   * @defaultValue https://broadcast-server.tor.us
   */
  storageServerUrl?: string;
}

export interface SessionData {
  privKey: string;
}
