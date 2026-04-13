import { SafeEventEmitter } from "@web3auth/auth";

import {
  CHAIN_NAMESPACES,
  CONNECTOR_CATEGORY,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  type CustomChainConfig,
  type IConnector,
  type IStorageAdapter,
  type ProjectConfig,
  WALLET_CONNECTORS,
} from "../src/base";

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

  public icon = "";

  private connectEvents: ConnectorEventMap = {};

  constructor(overrides: Partial<IConnector<unknown>> = {}, connectEvents: ConnectorEventMap = {}) {
    super();
    Object.assign(this, overrides);
    this.connectEvents = connectEvents;
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
}

export const MULTICHAIN_CONNECTOR_NAMESPACE = CONNECTOR_NAMESPACES.MULTICHAIN;
