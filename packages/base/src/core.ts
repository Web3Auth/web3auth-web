import { Web3AuthProvider, Web3AuthProviderConnection } from "./provider";

export interface Web3AuthOptions {
  network: string;
  providers: Record<string, Web3AuthProvider>;
}

export type Web3AuthEventType = "connect" | "disconnect" | "accountsChanged";

export class Web3Auth {
  readonly network: string;

  readonly providers: Record<string, Web3AuthProvider>;

  // Native event emitter, allow to dispatch and listen to events.
  private readonly events = new EventTarget();

  /**
   * Create a new instance of Web3Auth.
   *
   * `providers` is a map of provider keys to provider objects, keys are used to identify the provider in other functions.
   * @param params - Web3Auth options
   */
  constructor({ network, providers }: Web3AuthOptions) {
    this.network = network;
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
   */
  async connectTo(providerKey: string): Promise<Web3AuthProviderConnection> {
    throw new Error(`Method not implemented: ${JSON.stringify({ providerKey })}.`);
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
