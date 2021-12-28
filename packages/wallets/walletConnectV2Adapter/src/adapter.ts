import Client, { CLIENT_EVENTS } from "@walletconnect/client";
import { ClientOptions, ClientTypes, PairingTypes, SessionTypes } from "@walletconnect/types";
import { ERROR } from "@walletconnect/utils";
import {
  ADAPTER_CATEGORY,
  ADAPTER_CATEGORY_TYPE,
  ADAPTER_NAMESPACES,
  AdapterNamespaceType,
  BASE_WALLET_EVENTS,
  BaseWalletAdapter,
  CHAIN_NAMESPACES,
  ChainNamespaceType,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS,
  WalletConnectionError,
  WalletConnectV1Data,
  WalletNotConnectedError,
  WalletNotReadyError,
} from "@web3auth/base";
import log from "loglevel";

interface WalletConnectV2Options {
  adapterSettings?: ClientOptions;
  loginSettings?: ClientTypes.ConnectParams;
}

class WalletConnectV2Adapter extends BaseWalletAdapter {
  readonly namespace: AdapterNamespaceType = ADAPTER_NAMESPACES.EIP155;

  readonly currentChainNamespace: ChainNamespaceType = CHAIN_NAMESPACES.EIP155;

  readonly walletType: ADAPTER_CATEGORY_TYPE = ADAPTER_CATEGORY.EXTERNAL;

  readonly adapterOptions: WalletConnectV2Options;

  public connecting: boolean;

  public ready: boolean;

  public provider: SafeEventEmitterProvider;

  public connected: boolean;

  public adapterData: WalletConnectV1Data = {
    uri: "",
  };

  public pairings: string[];

  private walletConnectClient: Client;

  private session: SessionTypes.Settled;

  constructor(options: WalletConnectV2Options) {
    super();
    this.adapterOptions = options;
  }

  async init(options: { connect: boolean }): Promise<void> {
    if (this.ready) return;
    this.walletConnectClient = await Client.init(this.adapterOptions.adapterSettings);
    this.subscribeEvents(this.walletConnectClient);
    this.ready = true;
    this.emit(BASE_WALLET_EVENTS.READY, WALLET_ADAPTERS.WALLET_CONNECT_V1);
    try {
      if (options.connect) {
        await this.connect();
      }
    } catch (error) {
      this.emit(BASE_WALLET_EVENTS.ERRORED, error);
    }
  }

  async connect(): Promise<SafeEventEmitterProvider> {
    if (!this.ready) throw new WalletNotReadyError("Wallet connect adapter is not ready");
    this.connecting = true;
    this.emit(BASE_WALLET_EVENTS.CONNECTING);
    try {
      this.session = await this.walletConnectClient.connect(this.adapterOptions.loginSettings);

      // TODO: check what happens if qr code is closed.
      this.connected = true;
      // TODO: make provider types compatible
      this.provider = this.walletConnectClient as unknown as SafeEventEmitterProvider;
      this.emit(BASE_WALLET_EVENTS.CONNECTED, WALLET_ADAPTERS.WALLET_CONNECT_V2);
      return this.provider;
    } catch (error) {
      this.emit(BASE_WALLET_EVENTS.ERRORED, error);
      throw new WalletConnectionError("Failed to login with wallet connect", error);
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet");
    if (typeof this.walletConnectClient === "undefined") {
      throw new Error("WalletConnect is not initialized");
    }
    if (typeof this.session === "undefined") {
      throw new Error("Session is not connected");
    }
    await this.walletConnectClient.disconnect({
      topic: this.session.topic,
      reason: ERROR.USER_DISCONNECTED.format(),
    });
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    if (!this.connected) throw new WalletNotConnectedError("Not connected with wallet, Please login/connect first");
    return {};
  }

  private resetAdapter(): void {
    this.provider = undefined;
    this.walletConnectClient = undefined;
    this.session = undefined;
    this.connected = false;
    this.emit(BASE_WALLET_EVENTS.DISCONNECTED);
  }

  private subscribeEvents(walletConnectClient: Client): void {
    walletConnectClient.on(CLIENT_EVENTS.pairing.proposal, async (proposal: PairingTypes.Proposal) => {
      const { uri } = proposal.signal.params;
      this.adapterData = {
        ...this.adapterData,
        uri,
      };
      this.emit(BASE_WALLET_EVENTS.DATA, { adapter: WALLET_ADAPTERS.WALLET_CONNECT_V2, payload: this.adapterData });
    });

    // TODO: check if pairing is successful on connection
    walletConnectClient.on(CLIENT_EVENTS.pairing.created, async () => {
      if (typeof walletConnectClient === "undefined") return;
      this.pairings = walletConnectClient.pairing.topics;
    });

    walletConnectClient.on(CLIENT_EVENTS.session.deleted, (session: SessionTypes.Settled) => {
      if (session.topic !== this.session?.topic) return;
      log.debug("EVENT", "session_deleted");
      this.resetAdapter();
    });
  }
}

export { WalletConnectV2Adapter };
