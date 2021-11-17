import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";

import { AdapterNamespaceType } from "../chain/IChainInterface";
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

export interface IWalletAdapter extends SafeEventEmitter {
  namespace: AdapterNamespaceType;
  ready: boolean;
  connecting: boolean;
  connected: boolean;
  provider: SafeEventEmitterProvider;
  init<T>(params?: T): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo>>;
}

export abstract class BaseWalletAdapter extends SafeEventEmitter implements IWalletAdapter {
  public abstract namespace: AdapterNamespaceType;

  public abstract connecting: boolean;

  public abstract ready: boolean;

  public abstract connected: boolean;

  public abstract provider: SafeEventEmitterProvider;

  abstract init<T>(params: T): Promise<void>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract getUserInfo(): Promise<Partial<UserInfo>>;
}
