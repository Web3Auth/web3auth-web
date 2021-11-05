import { Web3AuthOAuthProvider, Web3AuthProvider, Web3AuthProviderConnection } from "./provider";

export interface Web3AuthOptions {
  network: string;
  oauthProvider: Web3AuthOAuthProvider;
  providers: Record<string, Web3AuthProvider>;
}

export type Web3AuthEventType = "connect" | "disconnect" | "accountsChanged";

export class Web3Auth {
  readonly network: string;

  // Special (Torus-specific) provider for OAuth logins (Google, Facebook, Passwordless, etc)
  readonly oauthProvider: Web3AuthOAuthProvider;

  readonly providers: Record<string, Web3AuthProvider>;

  // Native event emitter, allow to dispatch and listen to events.
  private readonly events = new EventTarget();

  /**
   * Create a new instance of Web3Auth.
   *
   * `providers` is a map of provider keys to provider objects, keys are used to identify the provider in other functions.
   * @param params - Web3Auth options
   */
  constructor({ network, oauthProvider, providers }: Web3AuthOptions) {
    this.network = network;
    this.oauthProvider = oauthProvider;
    this.providers = providers;
  }

  /**
   * Show a modal displaying all configured providers, connect to whichever one the user chooses and return the connection.
   */
  async connect(): Promise<Web3AuthProviderConnection> {
    throw new Error("Method not implemented.");
  }

  /**
   * Connect to a specific provider, throw if the provider is not configured.
   * @param providerKey - Key of the provider to use.
   * @param params - Extra params to pass to provider, useful for OAuth provider to provide login params.
   */
  async connectTo(providerKey: string, params?: object): Promise<Web3AuthProviderConnection> {
    throw new Error(`Method not implemented: ${JSON.stringify({ providerKey, params })}.`);
  }

  /**
   * Appends an event listener for events whose type attribute value is type. The callback argument sets the callback that will be invoked when the event is dispatched.
   */
  addEventListener(type: Web3AuthEventType, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    this.events.addEventListener(type, callback, options);
  }

  /**
   * Removes the event listener in target's event listener list with the same type, callback, and options.
   */
  removeEventListener(type: Web3AuthEventType, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
    this.events.removeEventListener(type, callback, options);
  }
}
