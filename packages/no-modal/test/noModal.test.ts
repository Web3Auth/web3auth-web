import { describe, expect, it, vi } from "vitest";

import {
  CHAIN_NAMESPACES,
  CONNECTED_STATUSES,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  IConnector,
  type WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  WEB3AUTH_STATE_STORAGE_KEY,
} from "../src/base";
import { Web3AuthNoModal } from "../src/noModal";
import { createChain, createMockStorage, createProjectConfig, MockConnector, MULTICHAIN_CONNECTOR_NAMESPACE } from "./helpers";

class TestWeb3AuthNoModal extends Web3AuthNoModal {
  public exposeInitChainsConfig(projectConfig: ReturnType<typeof createProjectConfig>) {
    this.initChainsConfig(projectConfig);
  }

  public exposeInitAccountAbstractionConfig(projectConfig: ReturnType<typeof createProjectConfig>) {
    this.initAccountAbstractionConfig(projectConfig);
  }

  public exposeSetConnectors(connectors: MockConnector[]) {
    this.setConnectors(connectors as unknown as IConnector<unknown>[]);
  }

  public exposeCheckIfAutoConnect(connector: MockConnector) {
    return this.checkIfAutoConnect(connector as unknown as IConnector<unknown>);
  }

  public exposeSetConsentRequired(value: boolean) {
    this.consentRequired = value;
  }

  public exposeSubscribeToConnectorEvents(connector: MockConnector) {
    this.subscribeToConnectorEvents(connector as unknown as IConnector<unknown>);
  }

  public exposeCompleteConsentAcceptance() {
    return this.completeConsentAcceptance();
  }
}

describe("Web3AuthNoModal", () => {
  it("throws when clientId is missing", () => {
    expect(
      () =>
        new Web3AuthNoModal({
          clientId: "",
          web3AuthNetwork: "sapphire_devnet",
          chains: [createChain()],
        } as never)
    ).toThrow(WalletInitializationError);
  });

  it("sets default initialAuthenticationMode and initial status", () => {
    const sdk = createSdk();
    expect(sdk.coreOptions.initialAuthenticationMode).toBe(CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN);
    expect(sdk.status).toBe(CONNECTOR_STATUS.NOT_READY);
  });

  it("loads initialState passed in constructor", async () => {
    const sdk = createSdk(
      {},
      {
        connectedConnectorName: WALLET_CONNECTORS.AUTH,
        cachedConnector: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        idToken: "id-token",
        accessToken: null,
        refreshToken: null,
      }
    );
    await Promise.resolve();
    expect(sdk.connectedConnectorName).toBe(WALLET_CONNECTORS.AUTH);
    expect(sdk.cachedConnector).toBe(WALLET_CONNECTORS.AUTH);
    expect(sdk.idToken).toBe("id-token");
  });

  it("returns fallback currentChainId from defaultChainId then first chain", () => {
    const withDefault = createSdk({ defaultChainId: "0xaa36a7" });
    expect(withDefault.currentChainId).toBe("0xaa36a7");

    const withFirstChain = createSdk({ defaultChainId: undefined, chains: [createChain({ chainId: "0x89" })] });
    expect(withFirstChain.currentChainId).toBe("0x89");
  });

  it("getConnector finds by name and namespace including multichain", () => {
    const sdk = createSdk();
    const evm = new MockConnector({ name: WALLET_CONNECTORS.METAMASK, connectorNamespace: CHAIN_NAMESPACES.EIP155 } as never);
    const solana = new MockConnector({ name: WALLET_CONNECTORS.WALLET_CONNECT_V2, connectorNamespace: CHAIN_NAMESPACES.SOLANA } as never);
    const multichain = new MockConnector({
      name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      connectorNamespace: MULTICHAIN_CONNECTOR_NAMESPACE,
    } as never);
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [evm, solana, multichain];

    expect(sdk.getConnector(WALLET_CONNECTORS.METAMASK)).toBe(evm);
    expect(sdk.getConnector(WALLET_CONNECTORS.METAMASK, CHAIN_NAMESPACES.SOLANA)).toBeNull();
    expect(sdk.getConnector(WALLET_CONNECTORS.WALLET_CONNECT_V2, CHAIN_NAMESPACES.SOLANA)).toBe(solana);
  });

  it("clearCache resets persisted state fields", async () => {
    const sdk = createSdk();
    (sdk as unknown as { state: Record<string, unknown> }).state = {
      connectedConnectorName: WALLET_CONNECTORS.AUTH,
      cachedConnector: WALLET_CONNECTORS.AUTH,
      currentChainId: "0x1",
      idToken: "id-token",
      accessToken: "access",
      refreshToken: "refresh",
    };

    await sdk.clearCache();
    const state = (sdk as unknown as { state: Record<string, unknown> }).state;
    expect(state.connectedConnectorName).toBeNull();
    expect(state.cachedConnector).toBeNull();
    expect(state.currentChainId).toBeNull();
    expect(state.idToken).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it("initChainsConfig merges project and user chains with user precedence", () => {
    const sdk = createSdk({
      chains: [createChain({ chainId: "0x1", displayName: "User chain", rpcTarget: "https://user-rpc.example.com" })],
    });
    const projectConfig = createProjectConfig({
      chains: [createChain({ chainId: "0x1", displayName: "Project chain", rpcTarget: "https://project-rpc.example.com" })],
    });

    sdk.exposeInitChainsConfig(projectConfig);
    expect(sdk.coreOptions.chains[0].displayName).toBe("User chain");
    expect(sdk.coreOptions.chains[0].rpcTarget).toBe("https://user-rpc.example.com");
  });

  it("initChainsConfig validates chain config", () => {
    const sdk = createSdk({ chains: [] });

    expect(() => sdk.exposeInitChainsConfig(createProjectConfig({ chains: [] }))).toThrow(WalletInitializationError);
    expect(() =>
      sdk.exposeInitChainsConfig(createProjectConfig({ chains: [createChain({ chainNamespace: "invalid" as never, chainId: "0x1" })] }))
    ).toThrow(WalletInitializationError);
    expect(() => sdk.exposeInitChainsConfig(createProjectConfig({ chains: [createChain({ chainId: "1" })] }))).toThrow(WalletInitializationError);
  });

  it("initAccountAbstractionConfig merges project and user AA config", () => {
    const sdk = createSdk({
      accountAbstractionConfig: {
        smartAccountType: "safe",
        chains: [{ chainId: "0x1", bundlerConfig: { url: "https://bundler.user.example.com" } }],
      },
    });
    sdk.exposeInitAccountAbstractionConfig(
      createProjectConfig({
        smartAccounts: {
          chains: [{ chainId: "0xaa36a7", bundlerConfig: { url: "https://bundler.project.example.com" } }],
        } as never,
      })
    );
    expect(sdk.coreOptions.accountAbstractionConfig?.chains).toHaveLength(2);
  });

  it("switchChain no-ops on same chain and throws for unknown chain", async () => {
    const sdk = createSdk();
    const provider = { switchChain: vi.fn() };
    (sdk as unknown as { commonJRPCProvider: { switchChain: (params: { chainId: string }) => Promise<void> } }).commonJRPCProvider = provider;

    await sdk.switchChain({ chainId: "0x1" });
    expect(provider.switchChain).not.toHaveBeenCalled();

    await expect(sdk.switchChain({ chainId: "0x999" })).rejects.toThrow(WalletInitializationError);
  });

  it("switchChain blocks cross-namespace switch for single-namespace connector", async () => {
    const sdk = createSdk({
      chains: [createChain(), createChain({ chainNamespace: CHAIN_NAMESPACES.SOLANA, chainId: "0x2", rpcTarget: "", ticker: "SOL" })],
    });
    const connector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      connectorNamespace: CHAIN_NAMESPACES.EIP155,
      switchChain: vi.fn(),
    } as never);
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [connector];
    (sdk as unknown as { state: Record<string, unknown> }).state = {
      connectedConnectorName: WALLET_CONNECTORS.METAMASK,
      cachedConnector: null,
      currentChainId: "0x1",
      idToken: null,
      accessToken: null,
      refreshToken: null,
    };
    sdk.status = CONNECTED_STATUSES[0];

    await expect(sdk.switchChain({ chainId: "0x2" })).rejects.toThrow(WalletLoginError);
  });

  it("connectTo validates connector and provider availability", async () => {
    const sdk = createSdk();
    await expect(sdk.connectTo(WALLET_CONNECTORS.METAMASK)).rejects.toThrow(WalletInitializationError);

    const connector = new MockConnector({ name: WALLET_CONNECTORS.METAMASK } as never);
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [connector];
    await expect(sdk.connectTo(WALLET_CONNECTORS.METAMASK)).rejects.toThrow(WalletInitializationError);
  });

  it("connectTo resolves in connect-only mode on CONNECTED", async () => {
    const sdk = createSdk({ initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_ONLY });
    (sdk as unknown as { commonJRPCProvider: Record<string, unknown> }).commonJRPCProvider = {};
    const connector = new MockConnector({ name: WALLET_CONNECTORS.METAMASK } as never, { connected: { connectorName: WALLET_CONNECTORS.METAMASK } });
    connector.connect = vi.fn(async () => {
      sdk.emit(CONNECTOR_EVENTS.CONNECTED, {
        connectorName: WALLET_CONNECTORS.METAMASK,
        ethereumProvider: null,
        solanaWallet: null,
        reconnected: false,
        loginMode: "no-modal",
      });
      return null;
    });
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [connector];

    await expect(sdk.connectTo(WALLET_CONNECTORS.METAMASK)).resolves.toBeNull();
  });

  it("connectTo resolves in connect-and-sign mode after CONNECTED and AUTHORIZED", async () => {
    const sdk = createSdk({ initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN });
    (sdk as unknown as { commonJRPCProvider: Record<string, unknown> }).commonJRPCProvider = {};
    const connector = new MockConnector({ name: WALLET_CONNECTORS.METAMASK } as never);
    connector.connect = vi.fn(async () => {
      sdk.emit(CONNECTOR_EVENTS.CONNECTED, {
        connectorName: WALLET_CONNECTORS.METAMASK,
        ethereumProvider: undefined,
        solanaWallet: undefined,
        reconnected: false,
        loginMode: "modal",
      });
      sdk.emit(CONNECTOR_EVENTS.AUTHORIZED, {
        authTokenInfo: { idToken: "id-token" },
        connector: "",
      });
      return null;
    });
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [connector];

    await expect(sdk.connectTo(WALLET_CONNECTORS.METAMASK)).resolves.toBeNull();
  });

  it("connectTo rejects on ERRORED event", async () => {
    const sdk = createSdk({ initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_ONLY });
    (sdk as unknown as { commonJRPCProvider: Record<string, unknown> }).commonJRPCProvider = {};
    const connector = new MockConnector({ name: WALLET_CONNECTORS.METAMASK } as never);
    connector.connect = vi.fn(async () => {
      sdk.emit(CONNECTOR_EVENTS.ERRORED, WalletLoginError.connectionError("failed") as never, "no-modal");
      return null;
    });
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [connector];

    await expect(sdk.connectTo(WALLET_CONNECTORS.METAMASK)).rejects.toThrow(WalletLoginError);
  });

  it("logout and getUserInfo throw when not connected", async () => {
    const sdk = createSdk();
    await expect(sdk.logout()).rejects.toThrow(WalletLoginError);
    await expect(sdk.getUserInfo()).rejects.toThrow(WalletLoginError);
  });

  it("auto-skips consent UI when prior consent is true", async () => {
    const storage = createMockStorage();
    await storage.set(WEB3AUTH_STATE_STORAGE_KEY, JSON.stringify({ hasUserConsent: true }));
    const sdk = createSdk({
      initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
      storage: { sessionId: storage },
    });
    await Promise.resolve();
    sdk.exposeSetConsentRequired(true);
    const consentRequiredListener = vi.fn();
    sdk.on(CONNECTOR_EVENTS.CONSENT_REQUIRING, consentRequiredListener);

    const ethereumProvider = { request: vi.fn().mockResolvedValue(["0xAbC123"]) };
    const authorizedListener = vi.fn();
    sdk.on(CONNECTOR_EVENTS.AUTHORIZED, authorizedListener);

    const connector = emitMetaMaskConnected(sdk, ethereumProvider);
    await vi.waitFor(() => {
      expect(sdk.status).toBe(CONNECTOR_STATUS.CONNECTED);
    });
    connector.emit(CONNECTOR_EVENTS.AUTHORIZED, {
      connector: WALLET_CONNECTORS.METAMASK,
      authTokenInfo: { idToken: "id-token" },
    });
    await vi.waitFor(() => {
      expect(authorizedListener).toHaveBeenCalledTimes(1);
    });

    expect(sdk.status).toBe(CONNECTOR_STATUS.AUTHORIZED);
    expect(consentRequiredListener).not.toHaveBeenCalled();
  });

  it("shows consent UI when prior consent is false", async () => {
    const storage = createMockStorage();
    await storage.set(WEB3AUTH_STATE_STORAGE_KEY, JSON.stringify({ hasUserConsent: false }));
    const sdk = createSdk({
      initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_ONLY,
      storage: { sessionId: storage },
    });
    await Promise.resolve();
    sdk.exposeSetConsentRequired(true);
    const consentRequiredListener = vi.fn();
    sdk.on(CONNECTOR_EVENTS.CONSENT_REQUIRING, consentRequiredListener);

    const ethereumProvider = { request: vi.fn().mockResolvedValue(["0xBEEF"]) };

    emitMetaMaskConnected(sdk, ethereumProvider);
    await vi.waitFor(() => {
      expect(consentRequiredListener).toHaveBeenCalledTimes(1);
    });

    expect(sdk.status).toBe(CONNECTOR_STATUS.CONSENT_REQUIRING);
    await sdk.exposeCompleteConsentAcceptance();
    expect(sdk.status).toBe(CONNECTOR_STATUS.CONNECTED);
  });

  it("persists user consent when user accepts consent UI", async () => {
    const storage = createMockStorage();
    const sdk = createSdk({
      initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_ONLY,
      storage: { sessionId: storage },
    });
    sdk.exposeSetConsentRequired(true);

    const consentRequiredListener = vi.fn();
    sdk.on(CONNECTOR_EVENTS.CONSENT_REQUIRING, consentRequiredListener);
    const ethereumProvider = { request: vi.fn().mockResolvedValue(["0xFEEd"]) };

    emitMetaMaskConnected(sdk, ethereumProvider);
    await vi.waitFor(() => {
      expect(consentRequiredListener).toHaveBeenCalledTimes(1);
    });
    await sdk.exposeCompleteConsentAcceptance();

    const stateJson = await storage.get(WEB3AUTH_STATE_STORAGE_KEY);
    const state = JSON.parse(stateJson!);
    expect(state.hasUserConsent).toBe(true);
  });

  it("setConnectors deduplicates and emits updates only for new connectors", () => {
    const sdk = createSdk();
    const updates: WALLET_CONNECTOR_TYPE[][] = [];
    sdk.on(CONNECTOR_EVENTS.CONNECTORS_UPDATED, ({ connectors }) => {
      updates.push(connectors.map((connector) => connector.name as WALLET_CONNECTOR_TYPE));
    });

    const first = new MockConnector({ name: WALLET_CONNECTORS.METAMASK, connectorNamespace: CHAIN_NAMESPACES.EIP155 } as never);
    const duplicate = new MockConnector({ name: WALLET_CONNECTORS.METAMASK, connectorNamespace: CHAIN_NAMESPACES.EIP155 } as never);
    const second = new MockConnector({ name: WALLET_CONNECTORS.AUTH, connectorNamespace: CHAIN_NAMESPACES.EIP155 } as never);

    sdk.exposeSetConnectors([first]);
    sdk.exposeSetConnectors([duplicate]);
    sdk.exposeSetConnectors([second]);

    expect(updates).toEqual([[WALLET_CONNECTORS.METAMASK], [WALLET_CONNECTORS.AUTH]]);
  });

  it("checkIfAutoConnect returns true only for cached matching connector", () => {
    const sdk = createSdk();
    (sdk as unknown as { state: Record<string, unknown> }).state = {
      connectedConnectorName: null,
      cachedConnector: WALLET_CONNECTORS.METAMASK,
      currentChainId: "0x1",
      idToken: null,
      accessToken: null,
      refreshToken: null,
    };
    const matching = new MockConnector({ name: WALLET_CONNECTORS.METAMASK, connectorNamespace: CHAIN_NAMESPACES.EIP155 } as never);
    const nonMatching = new MockConnector({ name: WALLET_CONNECTORS.AUTH, connectorNamespace: CHAIN_NAMESPACES.EIP155 } as never);
    const multichain = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      connectorNamespace: CONNECTOR_NAMESPACES.MULTICHAIN,
    } as never);

    expect(sdk.exposeCheckIfAutoConnect(matching)).toBe(true);
    expect(sdk.exposeCheckIfAutoConnect(nonMatching)).toBe(false);
    expect(sdk.exposeCheckIfAutoConnect(multichain)).toBe(true);
  });
});

function createSdk(overrides: Record<string, unknown> = {}, initialState?: Record<string, unknown>): TestWeb3AuthNoModal {
  const storage = createMockStorage();
  return new TestWeb3AuthNoModal(
    {
      clientId: "test-client-id",
      web3AuthNetwork: "sapphire_devnet",
      chains: [createChain()],
      disableAnalytics: true,
      storage: { sessionId: storage },
      ...overrides,
    } as never,
    initialState as never
  );
}

function emitMetaMaskConnected(sdk: TestWeb3AuthNoModal, ethereumProvider: unknown): MockConnector {
  const connector = new MockConnector({ name: WALLET_CONNECTORS.METAMASK } as never);
  (sdk as unknown as { connectors: MockConnector[] }).connectors = [connector];
  sdk.exposeSubscribeToConnectorEvents(connector);
  (sdk as unknown as { commonJRPCProvider: Record<string, unknown> }).commonJRPCProvider = {
    updateProviderEngineProxy: vi.fn(),
    removeAllListeners: vi.fn(),
  };

  connector.emit(CONNECTOR_EVENTS.CONNECTED, {
    connectorName: WALLET_CONNECTORS.METAMASK,
    ethereumProvider: ethereumProvider as never,
    solanaWallet: null,
    reconnected: false,
  });

  return connector;
}
