import { BaseRedirectParams, LoginParams } from "@toruslabs/openlogin-utils";
import { BaseAdapterSettings, IBaseProvider } from "@web3auth/base";

export type LoginSettings = Partial<LoginParams> & Partial<BaseRedirectParams>;

export type PrivateKeyProvider = IBaseProvider<string>;

export type FarcasterAdapterSettings = {
  /**
   * You can create a custom verifier from https://dashboard.web3auth.io
   * Note: If you want to use a custom verifier you need to host a server
   * to issue jwt tokens for this verifier.
   */
  verifier?: string;

  /**
   * ${window.location.host}/login is used as default siwe uri
   */
  siweUri?: string;

  /**
   * window.location.host is used as default domain
   */
  domain?: string;

  /**
   * nonce is generated using w3a hosted siwe server, you can host your server and
   * pass the server domain in siweServer parameter
   */
  nonce?: string;

  /**
   * Start time at which the signature becomes valid. ISO 8601 datetime.
   */
  notBefore?: string;

  /**
   * Expiration time at which the signature is no longer valid. ISO 8601 datetime.
   */
  expirationTime?: string;

  /**
   * Unique session/request id used to generate the nonce.
   */
  requestId?: string;

  /**
   * By default, w3a hosted server is used, in case you want to host your own
   * You can pass a custom siweServer with a custom verifier url here
   */
  siweServer?: string;
};
export interface FarcasterAdapterOptions extends BaseAdapterSettings {
  privateKeyProvider: PrivateKeyProvider;
  adapterSettings?: FarcasterAdapterSettings;
  loginSettings?: LoginSettings;
}

export type FarcasterLoginParams = Partial<Omit<LoginParams, "loginProvider">>;

export type FarcasterSIWEMessage = {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  nonce: string;
  issuedAt: string;
  chainId: number;
  resources: string[];
};

export type FarcasterVerifyResult = {
  token: string;
  fid: string;
  userinfo: FarcasterSIWEMessage;
};

export interface NonceCreationParams {
  sessionId: string;
  domain: string;
  expirationTime: string;
}

export interface VerifyFarcasterLoginParams {
  nonce: string;
  sessionId: string;
  message: string;
  signature: string;
  domain: string;
  issuer?: string;
  audience?: string;
  timeout?: number;
}
