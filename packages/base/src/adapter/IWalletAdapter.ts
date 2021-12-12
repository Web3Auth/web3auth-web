import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { AdapterNamespaceType, ChainNamespaceType } from "../chain/IChainInterface";
import { SafeEventEmitterProvider } from "../provider/IProvider";

export const BASE_WALLET_EVENTS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  ERRORED: "errored",
};

export type UserInfo = {
  /**
   * Email of the logged in user
   */
  email: string;
  /**
   * Full name of the logged in user
   */
  name: string;
  /**
   * Profile image of the logged in user
   */
  profileImage: string;
  /**
   * verifier of the logged in user (google, facebook etc)
   */
  verifier: string;
  /**
   * Verifier Id of the logged in user
   *
   * email for google,
   * id for facebook,
   * username for reddit,
   * id for twitch,
   * id for discord
   */
  verifierId: string;
};

export const ADAPTER_CATEGORY = {
  EXTERNAL: "external",
  IN_APP: "in_app",
} as const;
export type ADAPTER_CATEGORY_TYPE = typeof ADAPTER_CATEGORY[keyof typeof ADAPTER_CATEGORY];

export const LOGIN_PROVIDER = {
  GOOGLE: "google",
  FACEBOOK: "facebook",
  REDDIT: "reddit",
  DISCORD: "discord",
  TWITCH: "twitch",
  APPLE: "apple",
  LINE: "line",
  GITHUB: "github",
  KAKAO: "kakao",
  LINKEDIN: "linkedin",
  TWITTER: "twitter",
  WEIBO: "weibo",
  WECHAT: "wechat",
  EMAIL_PASSWORDLESS: "email_passwordless",
  WEBAUTHN: "webauthn",
  JWT: "jwt",
};
/**
 * {@label loginProviderType}
 */
export declare type LOGIN_PROVIDER_TYPE = typeof LOGIN_PROVIDER[keyof typeof LOGIN_PROVIDER];

export interface CommonLoginOptions {
  loginProvider?: LOGIN_PROVIDER_TYPE;
  loginHint?: string;
}

export interface IWalletAdapter extends SafeEventEmitter {
  namespace: AdapterNamespaceType;
  currentChainNamespace: ChainNamespaceType;
  walletType: ADAPTER_CATEGORY_TYPE;
  ready: boolean;
  connecting: boolean;
  connected: boolean;
  provider: SafeEventEmitterProvider;
  init(): Promise<void>;
  connect(params?: CommonLoginOptions): Promise<SafeEventEmitterProvider | null>;
  disconnect(): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo>>;
}

export abstract class BaseWalletAdapter extends SafeEventEmitter implements IWalletAdapter {
  public abstract namespace: AdapterNamespaceType;

  public abstract currentChainNamespace: ChainNamespaceType;

  public abstract walletType: ADAPTER_CATEGORY_TYPE;

  public abstract connecting: boolean;

  public abstract ready: boolean;

  public abstract connected: boolean;

  public abstract provider: SafeEventEmitterProvider;

  abstract init(): Promise<void>;
  abstract connect(params?: CommonLoginOptions): Promise<SafeEventEmitterProvider | null>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo>>;
}

export interface LoginMethodConfig {
  // label: string;
  visible?: boolean;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}
export interface BaseAdapterConfig {
  visible?: boolean;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}
