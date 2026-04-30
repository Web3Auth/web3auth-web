import type { Wallet } from "@wallet-standard/base";
import { type IStorageAdapter, SafeEventEmitter } from "@web3auth/auth";

import {
  type AuthTokenInfo,
  CHAIN_NAMESPACES,
  type ChainNamespaceType,
  type ConnectedAccountInfo,
  type Connection,
  CONNECTOR_CATEGORY,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  type CustomChainConfig,
  type IConnector,
  type IProvider,
  type LinkAccountParams,
  type LinkAccountResult,
  type ProjectConfig,
  type UnlinkAccountResult,
  type UserInfo,
  WALLET_CONNECTORS,
} from "../src/base";

export function createChain(overrides: Partial<CustomChainConfig> = {}): CustomChainConfig {
  return {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x1",
    rpcTarget: "https://rpc.ankr.com/eth",
    blockExplorerUrl: "https://etherscan.io",
    logo: "",
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
  resetStore(): Promise<void>;
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
    async remove(key: string) {
      delete data[key];
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
  public connectorNamespace: IConnector<unknown>["connectorNamespace"] = CHAIN_NAMESPACES.EIP155;

  public name: IConnector<unknown>["name"] = WALLET_CONNECTORS.AUTH;

  public type: IConnector<unknown>["type"] = CONNECTOR_CATEGORY.IN_APP;

  public status: IConnector<unknown>["status"] = CONNECTOR_STATUS.NOT_READY;

  public isInjected = false;

  public chainConfig: CustomChainConfig | undefined = undefined;

  public provider: IProvider | null = null;

  public solanaWallet: Wallet | null = null;

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

  async init(): Promise<void> {
    this.status = CONNECTOR_STATUS.READY;
  }

  async connect(_: { chainId: string }): Promise<Connection | null> {
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

  async disconnect(): Promise<void> {
    this.status = CONNECTOR_STATUS.READY;
    this.emit("disconnected");
  }

  async cleanup(): Promise<void> {}

  async switchChain(): Promise<void> {}

  async getUserInfo(): Promise<Partial<UserInfo>> {
    return {};
  }

  async getAuthTokenInfo(): Promise<AuthTokenInfo> {
    return { idToken: "id-token" };
  }

  async enableMFA(): Promise<void> {}

  async manageMFA(): Promise<void> {}

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
