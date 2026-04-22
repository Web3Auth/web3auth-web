import { SafeEventEmitter } from "@web3auth/auth";

import {
  CHAIN_NAMESPACES,
  type ChainNamespaceType,
  type ConnectedAccountInfo,
  CONNECTOR_CATEGORY,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  type CustomChainConfig,
  type IConnector,
  type IStorageAdapter,
  type LinkAccountParams,
  type LinkAccountResult,
  type ProjectConfig,
  type UnlinkAccountResult,
  WALLET_CONNECTORS,
} from "../src/base";
import { type AuthConnectorAccountLinkingHandlers } from "../src/connectors/auth-connector";

export function createChain(overrides: Partial<CustomChainConfig> = {}): CustomChainConfig {
  return {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x1",
    rpcTarget: "https://rpc.ankr.com/eth",
    displayName: "Ethereum Mainnet",
    ticker: "ETH",
    tickerName: "Ethereum",
    ...overrides,
  };
}

export function createProjectConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    chainNamespaces: [CHAIN_NAMESPACES.EIP155],
    chains: [createChain()],
    whitelabel: {},
    walletUi: {},
    embeddedWalletAuth: [],
    externalWalletAuth: null,
    teamId: "team-id",
    ...overrides,
  } as ProjectConfig;
}

export function createMockStorage(): IStorageAdapter & {
  data: Record<string, string>;
} {
  const data: Record<string, string> = {};
  return {
    data,
    async get(key: string) {
      return data[key] ?? null;
    },
    async set(key: string, value: string) {
      data[key] = value;
    },
    async resetStore() {
      Object.keys(data).forEach((key) => {
        delete data[key];
      });
    },
  };
}

type ConnectorEventMap = {
  connected?: unknown;
  authorized?: unknown;
  errored?: unknown;
};

export class MockConnector extends SafeEventEmitter implements IConnector<unknown> {
  public connectorNamespace = CHAIN_NAMESPACES.EIP155;

  public name = WALLET_CONNECTORS.AUTH;

  public type = CONNECTOR_CATEGORY.IN_APP;

  public status = CONNECTOR_STATUS.NOT_READY;

  public isInjected = false;

  public chainConfig = undefined;

  public provider = null;

  public solanaWallet = null;

  public icon = "";

  private connectEvents: ConnectorEventMap = {};

  constructor(overrides: Partial<IConnector<unknown>> = {}, connectEvents: ConnectorEventMap = {}) {
    super();
    Object.assign(this, overrides);
    this.connectEvents = connectEvents;
  }

  get connected() {
    return this.status === CONNECTOR_STATUS.CONNECTED;
  }

  setConnectEvents(events: ConnectorEventMap) {
    this.connectEvents = events;
  }

  async init() {
    this.status = CONNECTOR_STATUS.READY;
  }

  async connect() {
    this.status = CONNECTOR_STATUS.CONNECTING;
    queueMicrotask(() => {
      if (this.connectEvents.connected) {
        this.emit("connected", this.connectEvents.connected);
      }
      if (this.connectEvents.authorized) {
        this.emit("authorized", this.connectEvents.authorized);
      }
      if (this.connectEvents.errored) {
        this.emit("errored", this.connectEvents.errored);
      }
    });
    return null;
  }

  async disconnect() {
    this.status = CONNECTOR_STATUS.READY;
    this.emit("disconnected");
  }

  async cleanup() {}

  async switchChain() {}

  async getUserInfo() {
    return {};
  }

  async getAuthTokenInfo() {
    return { idToken: "id-token" };
  }

  async enableMFA() {}

  async manageMFA() {}

  setAccountLinkingHandlers(_: AuthConnectorAccountLinkingHandlers) {}

  async generateChallengeAndSign(): Promise<{ challenge: string; signature: string; chainNamespace: ChainNamespaceType }> {
    throw new Error("MockConnector.generateChallengeAndSign is not implemented.");
  }

  async switchAccount(_: ConnectedAccountInfo): Promise<void> {
    throw new Error("MockConnector.switchAccount is not implemented.");
  }

  async linkAccount(_: LinkAccountParams): Promise<LinkAccountResult> {
    throw new Error("MockConnector.linkAccount is not implemented.");
  }

  async unlinkAccount(_: string): Promise<UnlinkAccountResult> {
    throw new Error("MockConnector.unlinkAccount is not implemented.");
  }
}

export const MULTICHAIN_CONNECTOR_NAMESPACE = CONNECTOR_NAMESPACES.MULTICHAIN;
