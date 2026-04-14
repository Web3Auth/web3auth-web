import { describe, expect, it, vi } from "vitest";

import {
  type AuthTokenInfo,
  BaseConnector,
  type BaseConnectorLoginParams,
  CHAIN_NAMESPACES,
  type Connection,
  CONNECTOR_CATEGORY,
  type CONNECTOR_CATEGORY_TYPE,
  CONNECTOR_EVENTS,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  type ConnectorInitOptions,
  type ConnectorNamespaceType,
  type CustomChainConfig,
  type IProvider,
  type UserInfo,
  type WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
} from "../src/base";
import { createChain } from "./helpers";

class TestConnector extends BaseConnector<void> {
  connectorNamespace: ConnectorNamespaceType = CONNECTOR_NAMESPACES.MULTICHAIN;

  type: CONNECTOR_CATEGORY_TYPE = CONNECTOR_CATEGORY.EXTERNAL;

  name: WALLET_CONNECTOR_TYPE | string = WALLET_CONNECTORS.AUTH;

  status: CONNECTOR_STATUS_TYPE = CONNECTOR_STATUS.NOT_READY;

  private _provider: IProvider | null = null;

  get provider(): IProvider | null {
    return this._provider;
  }

  setProvider(p: IProvider | null) {
    this._provider = p;
  }

  async init(_?: ConnectorInitOptions): Promise<void> {
    this.status = CONNECTOR_STATUS.READY;
  }

  async connect(_params: void & BaseConnectorLoginParams): Promise<Connection | null> {
    super.checkConnectionRequirements();
    this.status = CONNECTOR_STATUS.CONNECTED;
    return null;
  }

  async disconnect(): Promise<void> {
    super.checkDisconnectionRequirements();
    this.status = CONNECTOR_STATUS.READY;
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {
    return {};
  }

  async enableMFA(): Promise<void> {}

  async manageMFA(): Promise<void> {}

  async getAuthTokenInfo(): Promise<AuthTokenInfo> {
    return { idToken: "test" };
  }

  async switchChain(params: { chainId: string }): Promise<void> {
    super.checkSwitchChainRequirements(params);
  }

  exposedCheckInit(cfg: { chainConfig?: CustomChainConfig }) {
    this.checkInitializationRequirements(cfg);
  }
}

function createConnector(
  overrides: {
    status?: CONNECTOR_STATUS_TYPE;
    name?: WALLET_CONNECTOR_TYPE | string;
    connectorNamespace?: ConnectorNamespaceType;
    isInjected?: boolean;
    chains?: CustomChainConfig[];
  } = {}
): TestConnector {
  const chains = overrides.chains ?? [createChain()];
  const c = new TestConnector({
    coreOptions: {
      clientId: "test-client-id",
      web3AuthNetwork: "sapphire_devnet",
      chains,
    },
  } as never);
  if (overrides.status) c.status = overrides.status;
  if (overrides.name) c.name = overrides.name;
  if (overrides.connectorNamespace) c.connectorNamespace = overrides.connectorNamespace;
  if (overrides.isInjected !== undefined) c.isInjected = overrides.isInjected;
  return c;
}

describe("BaseConnector", () => {
  describe("connected / canAuthorize getters", () => {
    it("connected is true for CONNECTED and AUTHORIZED statuses", () => {
      const c = createConnector({ status: CONNECTOR_STATUS.CONNECTED });
      expect(c.connected).toBe(true);
      c.status = CONNECTOR_STATUS.AUTHORIZED;
      expect(c.connected).toBe(true);
    });

    it("connected is false for non-connected statuses", () => {
      for (const s of [CONNECTOR_STATUS.NOT_READY, CONNECTOR_STATUS.READY, CONNECTOR_STATUS.CONNECTING, CONNECTOR_STATUS.ERRORED]) {
        const c = createConnector({ status: s });
        expect(c.connected).toBe(false);
      }
    });

    it("canAuthorize is true for CONNECTED, AUTHORIZING, AUTHORIZED", () => {
      for (const s of [CONNECTOR_STATUS.CONNECTED, CONNECTOR_STATUS.AUTHORIZING, CONNECTOR_STATUS.AUTHORIZED]) {
        const c = createConnector({ status: s });
        expect(c.canAuthorize).toBe(true);
      }
    });

    it("canAuthorize is false for READY / NOT_READY / CONNECTING", () => {
      for (const s of [CONNECTOR_STATUS.READY, CONNECTOR_STATUS.NOT_READY, CONNECTOR_STATUS.CONNECTING]) {
        const c = createConnector({ status: s });
        expect(c.canAuthorize).toBe(false);
      }
    });
  });

  describe("checkConnectionRequirements", () => {
    it("throws when status is CONNECTING (generic connector)", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.CONNECTING });
      await expect(c.connect(undefined as never)).rejects.toThrow(WalletInitializationError);
    });

    it("allows re-connect when CONNECTING for WalletConnect V2", async () => {
      const c = createConnector({
        status: CONNECTOR_STATUS.CONNECTING,
        name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      });
      await expect(c.connect(undefined as never)).resolves.toBeNull();
    });

    it("allows re-connect when CONNECTING for non-injected MetaMask", async () => {
      const c = createConnector({
        status: CONNECTOR_STATUS.CONNECTING,
        name: WALLET_CONNECTORS.METAMASK,
        isInjected: false,
      });
      await expect(c.connect(undefined as never)).resolves.toBeNull();
    });

    it("throws when already connected", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.CONNECTED });
      await expect(c.connect(undefined as never)).rejects.toThrow(WalletLoginError);
    });

    it("throws when not ready", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.NOT_READY });
      await expect(c.connect(undefined as never)).rejects.toThrow(WalletLoginError);
    });

    it("succeeds when READY", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.READY });
      await expect(c.connect(undefined as never)).resolves.toBeNull();
    });
  });

  describe("checkInitializationRequirements", () => {
    it("throws when clientId is empty", () => {
      const c = new TestConnector({ coreOptions: { clientId: "", chains: [createChain()] } } as never);
      expect(() => c.exposedCheckInit({ chainConfig: createChain() })).toThrow("clientId");
    });

    it("throws when chainConfig is missing", () => {
      const c = createConnector();
      expect(() => c.exposedCheckInit({})).toThrow("chainConfig is required");
    });

    it("throws when rpcTarget is missing for non-OTHER namespace", () => {
      const c = createConnector();
      expect(() => c.exposedCheckInit({ chainConfig: createChain({ rpcTarget: "" }) })).toThrow("rpcTarget");
    });

    it("throws when chainId is missing for non-OTHER namespace", () => {
      const c = createConnector();
      expect(() => c.exposedCheckInit({ chainConfig: createChain({ chainId: "" }) })).toThrow("chainID");
    });

    it("throws when connector namespace doesn't match chain namespace", () => {
      const c = createConnector({ connectorNamespace: CHAIN_NAMESPACES.SOLANA as ConnectorNamespaceType });
      expect(() => c.exposedCheckInit({ chainConfig: createChain() })).toThrow("chain namespace");
    });

    it("passes for MULTICHAIN connector with EIP155 chain", () => {
      const c = createConnector({ connectorNamespace: CONNECTOR_NAMESPACES.MULTICHAIN });
      expect(() => c.exposedCheckInit({ chainConfig: createChain() })).not.toThrow();
    });

    it("throws when already connected", () => {
      const c = createConnector({ status: CONNECTOR_STATUS.CONNECTED });
      expect(() => c.exposedCheckInit({ chainConfig: createChain() })).toThrow("Already connected");
    });

    it("throws when already initialized (READY)", () => {
      const c = createConnector({ status: CONNECTOR_STATUS.READY });
      expect(() => c.exposedCheckInit({ chainConfig: createChain() })).toThrow("already initialized");
    });
  });

  describe("checkDisconnectionRequirements", () => {
    it("throws when not connected", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.READY });
      await expect(c.disconnect()).rejects.toThrow(WalletLoginError);
    });

    it("succeeds when connected", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.CONNECTED });
      await expect(c.disconnect()).resolves.toBeUndefined();
    });
  });

  describe("checkSwitchChainRequirements", () => {
    it("throws when no provider and no solanaWallet", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.CONNECTED });
      await expect(c.switchChain({ chainId: "0x1" })).rejects.toThrow(WalletLoginError);
    });

    it("throws for unknown chainId", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.CONNECTED });
      c.setProvider({} as IProvider);
      await expect(c.switchChain({ chainId: "0x999" })).rejects.toThrow("Invalid chainId");
    });

    it("succeeds for a known chainId when provider is present", async () => {
      const c = createConnector({ status: CONNECTOR_STATUS.CONNECTED });
      c.setProvider({} as IProvider);
      await expect(c.switchChain({ chainId: "0x1" })).resolves.toBeUndefined();
    });

    it("throws when chains config is missing", async () => {
      const c = new TestConnector({
        coreOptions: { clientId: "id", chains: undefined },
      } as never);
      c.status = CONNECTOR_STATUS.CONNECTED;
      c.setProvider({} as IProvider);
      await expect(c.switchChain({ chainId: "0x1" })).rejects.toThrow("chainConfigs is required");
    });
  });

  describe("updateConnectorData", () => {
    it("updates connectorData and emits CONNECTOR_DATA_UPDATED", () => {
      const c = createConnector();
      const handler = vi.fn();
      c.on(CONNECTOR_EVENTS.CONNECTOR_DATA_UPDATED, handler);

      c.updateConnectorData({ foo: "bar" });

      expect(c.connectorData).toEqual({ foo: "bar" });
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({ connectorName: c.name, data: { foo: "bar" } });
    });
  });

  describe("default getters", () => {
    it("solanaWallet returns null by default", () => {
      const c = createConnector();
      expect(c.solanaWallet).toBeNull();
    });
  });
});
