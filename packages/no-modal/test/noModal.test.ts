import { SafeEventEmitter } from "@web3auth/auth";
import { describe, expect, it, vi } from "vitest";

import {
  CHAIN_NAMESPACES,
  CONNECTED_STATUSES,
  type Connection,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  IConnector,
  type LinkedAccountInfo,
  log,
  type WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  WEB3AUTH_STATE_STORAGE_KEY,
} from "../src/base";
import { authConnector } from "../src/connectors/auth-connector";
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

  public exposeHasUsableConnectedSwitchConnector(connector: IConnector<unknown> | null) {
    return this.hasUsableConnectedSwitchConnector(connector);
  }

  public exposeGetConnectedWalletConnector(account?: LinkedAccountInfo | null) {
    return this.getConnectedWalletConnector(account);
  }

  public exposeSetConnectedWalletConnector(connector: IConnector<unknown>, account?: LinkedAccountInfo | null) {
    this.setConnectedWalletConnector(connector, account);
  }

  public exposeSetActiveWalletConnectorKey(account?: LinkedAccountInfo | null) {
    this.setActiveWalletConnectorKey(account);
  }

  public exposeProcessSwitchAccountResult(...args: Parameters<Web3AuthNoModal["processSwitchAccountResult"]>) {
    return this.processSwitchAccountResult(...args);
  }
}

type WsAccountsChangedTestProvider = SafeEventEmitter & {
  chainId: string;
  request: ReturnType<typeof vi.fn>;
};

type WsAccountsChangedTestConnector = {
  bindWsEmbedProviderEvents: () => void;
  disconnect: ReturnType<typeof vi.fn>;
  status: string;
  wsEmbedInstance: { provider: WsAccountsChangedTestProvider } | null;
};

function createWsAccountsChangedTestHarness() {
  const connector = authConnector()({
    projectConfig: createProjectConfig(),
    coreOptions: {
      clientId: "test-client-id",
      web3AuthNetwork: "sapphire_devnet",
      chains: [createChain()],
    } as never,
    analytics: { track: vi.fn() } as never,
  }) as unknown as WsAccountsChangedTestConnector;
  const provider = new SafeEventEmitter() as WsAccountsChangedTestProvider;
  provider.chainId = "0x1";
  provider.request = vi.fn();
  connector.wsEmbedInstance = { provider };
  return { connector, provider };
}

describe("authConnector", () => {
  it("ignores zero-account wallet services events before the connector is connected", async () => {
    const { connector, provider } = createWsAccountsChangedTestHarness();
    connector.status = CONNECTOR_STATUS.NOT_READY;
    connector.disconnect = vi.fn().mockRejectedValue(new Error("disconnect should not run"));

    connector.bindWsEmbedProviderEvents();
    provider.emit("accountsChanged", []);
    await Promise.resolve();

    expect(connector.disconnect).not.toHaveBeenCalled();
  });

  it("catches disconnect failures from zero-account wallet services events", async () => {
    const { connector, provider } = createWsAccountsChangedTestHarness();
    const disconnectError = new Error("disconnect failed");
    const logErrorSpy = vi.spyOn(log, "error").mockImplementation((..._args: unknown[]) => undefined as never);
    connector.status = CONNECTOR_STATUS.CONNECTED;
    connector.disconnect = vi.fn().mockRejectedValue(disconnectError);

    try {
      connector.bindWsEmbedProviderEvents();
      provider.emit("accountsChanged", []);
      await Promise.resolve();

      expect(connector.disconnect).toHaveBeenCalledWith({ cleanup: true });
      expect(logErrorSpy).toHaveBeenCalledWith("Failed to disconnect auth connector after wallet accounts changed", disconnectError);
    } finally {
      logErrorSpy.mockRestore();
    }
  });
});

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
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        cachedConnector: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        idToken: "id-token",
        accessToken: null,
        refreshToken: null,
      }
    );
    await Promise.resolve();
    expect(sdk.primaryConnectorName).toBe(WALLET_CONNECTORS.AUTH);
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

  it("treats a missing switch connector as unusable", () => {
    const sdk = createSdk();

    expect(sdk.exposeHasUsableConnectedSwitchConnector(null)).toBe(false);
  });

  it("exposes provider sync and account readiness from the active AUTH connector", () => {
    const sdk = createSdk();
    const authConnector = new MockConnector({
      name: WALLET_CONNECTORS.AUTH,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: { request: vi.fn() } as never,
    } as never) as MockConnector & {
      isProviderStateSyncing: boolean;
      isAccountReady: boolean;
    };

    authConnector.isProviderStateSyncing = true;
    authConnector.isAccountReady = false;
    (sdk as unknown as { state: Record<string, unknown> }).state = {
      primaryConnectorName: WALLET_CONNECTORS.AUTH,
      cachedConnector: null,
      currentChainId: "0x1",
      idToken: null,
      accessToken: null,
      refreshToken: null,
      activeAccount: null,
    };
    sdk.exposeSetConnectors([authConnector]);
    sdk.status = CONNECTOR_STATUS.CONNECTED;
    sdk.exposeSetConnectedWalletConnector(authConnector);

    expect(sdk.isProviderStateSyncing).toBe(true);
    expect(sdk.isAccountReady).toBe(false);

    authConnector.isProviderStateSyncing = false;
    authConnector.isAccountReady = true;

    expect(sdk.isProviderStateSyncing).toBe(false);
    expect(sdk.isAccountReady).toBe(true);
  });

  it("returns the connected wallet provider for an active external account", async () => {
    const activeAccount = createExternalAccount();
    const sdk = createSdk(
      {},
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        activeAccount,
      }
    );
    await Promise.resolve();

    const linkedProvider = { request: vi.fn() };
    const linkedConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: linkedProvider as never,
    } as never);
    sdk.exposeSetConnectedWalletConnector(linkedConnector, activeAccount);
    sdk.exposeSetActiveWalletConnectorKey(activeAccount);

    expect(sdk.connection).toEqual({
      connectorName: WALLET_CONNECTORS.METAMASK,
      ethereumProvider: linkedProvider,
      solanaWallet: null,
    });
  });

  it("switches to a linked account without rebinding the AUTH provider proxy", async () => {
    const sdk = createSdk(
      {},
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
      }
    );
    await Promise.resolve();

    const activeAccount = createExternalAccount();
    const authProvider = { chainId: "0x1" };
    const linkedProvider = { request: vi.fn() };
    const updateProviderEngineProxy = vi.fn();
    const primaryConnector = new MockConnector({
      name: WALLET_CONNECTORS.AUTH,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: authProvider as never,
    } as never);
    const walletConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: linkedProvider as never,
    } as never);
    const authConnector = {
      assertSwitchAccountConnectorMatchesTarget: vi.fn().mockResolvedValue(undefined),
      toSwitchAccountConnectorError: vi.fn((_: unknown, error: unknown) => error),
    } as never;

    sdk.exposeSetConnectedWalletConnector(primaryConnector);
    (sdk as unknown as { commonJRPCProvider: { updateProviderEngineProxy: ReturnType<typeof vi.fn> } }).commonJRPCProvider = {
      updateProviderEngineProxy,
    };

    const connectionUpdatedListener = vi.fn();
    sdk.on(CONNECTOR_EVENTS.CONNECTION_UPDATED, connectionUpdatedListener);

    await sdk.exposeProcessSwitchAccountResult(
      authConnector,
      {
        kind: "external",
        targetAccount: activeAccount,
        activeAccount,
        activeChainId: "0x1",
      },
      { walletConnector }
    );

    expect(updateProviderEngineProxy).not.toHaveBeenCalled();
    expect(sdk.exposeGetConnectedWalletConnector()).toBe(primaryConnector);
    expect(connectionUpdatedListener).toHaveBeenCalledWith({
      connectorName: WALLET_CONNECTORS.METAMASK,
      ethereumProvider: linkedProvider,
      solanaWallet: null,
    });
    expect(sdk.connection).toEqual({
      connectorName: WALLET_CONNECTORS.METAMASK,
      ethereumProvider: linkedProvider,
      solanaWallet: null,
    });
  });

  it("keeps the preferred chain when the linked account stays in the same namespace", () => {
    const connector = authConnector()({
      projectConfig: createProjectConfig(),
      coreOptions: {
        clientId: "test-client-id",
        web3AuthNetwork: "sapphire_devnet",
        chains: [
          createChain({
            chainId: "0xaa36a7",
            rpcTarget: "https://rpc.ankr.com/eth_sepolia",
            displayName: "Ethereum Sepolia",
          }),
          createChain(),
        ],
      } as never,
      analytics: { track: vi.fn() } as never,
    }) as unknown as {
      getChainIdForLinkedAccount: (account: Pick<LinkedAccountInfo, "chainNamespace" | "connector">, preferredChainId?: string | null) => string;
    };

    expect(connector.getChainIdForLinkedAccount(createExternalAccount({ chainNamespace: "evm" }), "0xaa36a7")).toBe("0xaa36a7");
  });

  it("switches back to the primary account without rebinding the AUTH provider proxy", async () => {
    const activeAccount = createExternalAccount();
    const sdk = createSdk(
      {},
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
      }
    );
    await Promise.resolve();

    const authProvider = { chainId: "0x1" };
    const linkedProvider = { request: vi.fn() };
    const updateProviderEngineProxy = vi.fn();
    const authConnector = new MockConnector({
      name: WALLET_CONNECTORS.AUTH,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: authProvider as never,
    } as never);
    const linkedConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: linkedProvider as never,
    } as never);

    (sdk as unknown as { connectors: MockConnector[] }).connectors = [authConnector];
    (sdk as unknown as { commonJRPCProvider: { updateProviderEngineProxy: ReturnType<typeof vi.fn> } }).commonJRPCProvider = {
      updateProviderEngineProxy,
    };
    sdk.exposeSubscribeToConnectorEvents(authConnector);

    authConnector.emit(CONNECTOR_EVENTS.CONNECTED, {
      connectorName: WALLET_CONNECTORS.AUTH,
      ethereumProvider: authProvider,
      solanaWallet: null,
      reconnected: false,
    });

    await vi.waitFor(() => {
      expect(updateProviderEngineProxy).toHaveBeenCalledWith(authProvider);
    });

    sdk.exposeSetConnectedWalletConnector(linkedConnector, activeAccount);
    sdk.exposeSetActiveWalletConnectorKey(activeAccount);
    updateProviderEngineProxy.mockClear();

    const connectionUpdatedListener = vi.fn();
    sdk.on(CONNECTOR_EVENTS.CONNECTION_UPDATED, connectionUpdatedListener);

    await sdk.exposeProcessSwitchAccountResult(
      authConnector as never,
      {
        kind: "primary",
        targetAccount: createPrimaryAccount(),
        activeAccount: null,
        activeChainId: "0x1",
        connectorName: WALLET_CONNECTORS.AUTH,
        connectorNamespace: CHAIN_NAMESPACES.EIP155,
        ethereumProvider: authProvider as never,
        solanaWallet: null,
      },
      {}
    );

    expect(updateProviderEngineProxy).not.toHaveBeenCalled();
    expect(connectionUpdatedListener).toHaveBeenCalledWith({
      connectorName: WALLET_CONNECTORS.AUTH,
      ethereumProvider: (sdk as unknown as { commonJRPCProvider: unknown }).commonJRPCProvider,
      solanaWallet: null,
    });
    expect(sdk.connection).toEqual({
      connectorName: WALLET_CONNECTORS.AUTH,
      ethereumProvider: (sdk as unknown as { commonJRPCProvider: unknown }).commonJRPCProvider,
      solanaWallet: null,
    });
  });

  it("reuses the current chain when switching linked accounts within the same namespace", async () => {
    const sdk = createSdk(
      {
        chains: [
          createChain({
            chainId: "0xaa36a7",
            rpcTarget: "https://rpc.ankr.com/eth_sepolia",
            displayName: "Ethereum Sepolia",
          }),
          createChain(),
        ],
      },
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0xaa36a7",
      }
    );
    await Promise.resolve();

    const targetAccount = createExternalAccount({ chainNamespace: "evm" });
    const linkedProvider = { request: vi.fn() };
    const walletConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      status: CONNECTOR_STATUS.READY,
    } as never);
    walletConnector.connect = vi.fn().mockResolvedValue({
      connectorName: WALLET_CONNECTORS.METAMASK,
      ethereumProvider: linkedProvider as never,
      solanaWallet: null,
    });

    const authConnector = {
      assertSwitchAccountConnectorMatchesTarget: vi.fn().mockResolvedValue(undefined),
      toSwitchAccountConnectorError: vi.fn((_: unknown, error: unknown) => error),
    } as never;

    await sdk.exposeProcessSwitchAccountResult(
      authConnector,
      {
        kind: "external",
        targetAccount,
        activeAccount: targetAccount,
        activeChainId: "0x1",
      },
      { walletConnector }
    );

    expect(walletConnector.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: "0xaa36a7",
      })
    );
    expect(sdk.currentChainId).toBe("0xaa36a7");
  });

  it("rehydrates an active linked account without rebinding the AUTH proxy to the linked wallet", async () => {
    const activeAccount = createExternalAccount();
    const sdk = createSdk(
      {},
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        cachedConnector: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        activeAccount,
      }
    );
    await Promise.resolve();

    const authProvider = { chainId: "0x1" };
    const linkedProvider = { request: vi.fn() };
    const updateProviderEngineProxy = vi.fn();
    const authConnector = new MockConnector({
      name: WALLET_CONNECTORS.AUTH,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: authProvider as never,
    } as never) as MockConnector & {
      getChainIdForLinkedAccount: ReturnType<typeof vi.fn>;
    };
    const linkedConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: linkedProvider as never,
    } as never);
    authConnector.getChainIdForLinkedAccount = vi.fn().mockReturnValue("0x1");

    (sdk as unknown as { connectors: MockConnector[] }).connectors = [authConnector];
    (sdk as unknown as { commonJRPCProvider: { updateProviderEngineProxy: ReturnType<typeof vi.fn> } }).commonJRPCProvider = {
      updateProviderEngineProxy,
    };
    vi.spyOn(sdk as unknown as { createIsolatedWalletConnector: () => Promise<MockConnector> }, "createIsolatedWalletConnector").mockResolvedValue(
      linkedConnector
    );
    sdk.exposeSubscribeToConnectorEvents(authConnector);

    authConnector.emit(CONNECTOR_EVENTS.CONNECTED, {
      connectorName: WALLET_CONNECTORS.AUTH,
      ethereumProvider: authProvider,
      solanaWallet: null,
      reconnected: true,
    });

    await vi.waitFor(() => {
      expect(updateProviderEngineProxy).toHaveBeenCalledWith(authProvider);
    });

    expect(updateProviderEngineProxy).not.toHaveBeenCalledWith(linkedProvider);
    expect(sdk.exposeGetConnectedWalletConnector()).toBe(authConnector);
    expect(sdk.exposeGetConnectedWalletConnector(activeAccount)).toBe(linkedConnector);
    expect(sdk.connection).toEqual({
      connectorName: WALLET_CONNECTORS.METAMASK,
      ethereumProvider: linkedProvider,
      solanaWallet: null,
    });
  });

  it("returns no connected accounts with providers before authorization", async () => {
    const sdk = createSdk(
      {},
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
      }
    );
    await Promise.resolve();
    sdk.status = CONNECTOR_STATUS.CONNECTED;

    const primaryAccount = createPrimaryAccount();
    const authProvider = { request: vi.fn() };
    const authConnector = new MockConnector({
      name: WALLET_CONNECTORS.AUTH,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: authProvider as never,
    } as never);

    (sdk as unknown as { connectors: MockConnector[] }).connectors = [authConnector];
    sdk.exposeSetConnectedWalletConnector(authConnector, primaryAccount);

    expect(sdk.getConnectedAccountsWithProviders()).toEqual([]);
  });

  it("returns only usable connected accounts with providers after authorization", async () => {
    const sdk = createSdk(
      {},
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
      }
    );
    await Promise.resolve();
    sdk.status = CONNECTOR_STATUS.AUTHORIZED;

    const primaryAccount = createPrimaryAccount();
    const inactiveLinkedAccount = createExternalAccount({
      id: "inactive-linked-account-id",
      active: false,
    });
    const authProvider = { request: vi.fn() };
    const inactiveLinkedProvider = { request: vi.fn() };
    const authConnector = new MockConnector({
      name: WALLET_CONNECTORS.AUTH,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: authProvider as never,
    } as never);
    const inactiveLinkedConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      status: CONNECTOR_STATUS.READY,
      provider: inactiveLinkedProvider as never,
    } as never);

    (sdk as unknown as { connectors: MockConnector[] }).connectors = [authConnector, inactiveLinkedConnector];
    sdk.exposeSetConnectedWalletConnector(authConnector, primaryAccount);
    sdk.exposeSetConnectedWalletConnector(inactiveLinkedConnector, inactiveLinkedAccount);

    expect(sdk.getConnectedAccountsWithProviders()).toEqual([
      expect.objectContaining({
        id: primaryAccount.id,
        isPrimary: true,
        eoaAddress: primaryAccount.eoaAddress,
        accountType: primaryAccount.accountType,
        active: true,
        connector: authConnector,
        signingProvider: authProvider,
        connected: true,
      }),
    ]);
  });

  it("clearCache resets persisted state fields", async () => {
    const sdk = createSdk();
    (sdk as unknown as { state: Record<string, unknown> }).state = {
      primaryConnectorName: WALLET_CONNECTORS.AUTH,
      cachedConnector: WALLET_CONNECTORS.AUTH,
      currentChainId: "0x1",
      idToken: "id-token",
      accessToken: "access",
      refreshToken: "refresh",
    };

    await sdk.clearCache();
    const state = (sdk as unknown as { state: Record<string, unknown> }).state;
    expect(state.primaryConnectorName).toBeNull();
    expect(state.cachedConnector).toBeNull();
    expect(state.currentChainId).toBeNull();
    expect(state.idToken).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it("ignores inactive connector lifecycle events without clearing the active AUTH session", async () => {
    const sdk = createSdk(
      {},
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        cachedConnector: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        idToken: "id-token",
        accessToken: "access-token",
        refreshToken: "refresh-token",
        activeAccount: null,
      }
    );
    await Promise.resolve();
    sdk.status = CONNECTED_STATUSES[0];

    const authProvider = { request: vi.fn() };
    const primaryConnection: Connection = {
      connectorName: WALLET_CONNECTORS.AUTH,
      ethereumProvider: authProvider as never,
      solanaWallet: null,
    };

    const authConnector = new MockConnector({
      name: WALLET_CONNECTORS.AUTH,
      status: CONNECTOR_STATUS.CONNECTED,
      provider: authProvider as never,
    } as never);
    const inactiveConnector = new MockConnector({ name: WALLET_CONNECTORS.METAMASK } as never);
    sdk.exposeSetConnectedWalletConnector(authConnector);
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [authConnector, inactiveConnector];
    sdk.exposeSubscribeToConnectorEvents(authConnector);
    sdk.exposeSubscribeToConnectorEvents(inactiveConnector);

    inactiveConnector.emit(CONNECTOR_EVENTS.ERRORED, WalletLoginError.connectionError("User rejected request"));
    inactiveConnector.emit(CONNECTOR_EVENTS.DISCONNECTED, { connector: WALLET_CONNECTORS.METAMASK });
    inactiveConnector.emit(CONNECTOR_EVENTS.CACHE_CLEAR);
    inactiveConnector.emit(CONNECTOR_EVENTS.REHYDRATION_ERROR, WalletLoginError.connectionError("rehydration failed"));
    await Promise.resolve();

    expect(sdk.status).toBe(CONNECTED_STATUSES[0]);
    expect(sdk.primaryConnectorName).toBe(WALLET_CONNECTORS.AUTH);
    expect(sdk.idToken).toBe("id-token");
    expect(sdk.accessToken).toBe("access-token");
    expect(sdk.refreshToken).toBe("refresh-token");
    expect(sdk.connection).toEqual(primaryConnection);
  });

  it("still clears the session when the active connector errors", async () => {
    const sdk = createSdk(
      {},
      {
        primaryConnectorName: WALLET_CONNECTORS.AUTH,
        cachedConnector: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        idToken: "id-token",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      }
    );
    await Promise.resolve();
    sdk.status = CONNECTED_STATUSES[0];

    const authConnector = new MockConnector({ name: WALLET_CONNECTORS.AUTH } as never);
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [authConnector];
    sdk.exposeSubscribeToConnectorEvents(authConnector);

    authConnector.emit(CONNECTOR_EVENTS.ERRORED, WalletLoginError.connectionError("active connector failed"));
    await vi.waitFor(() => {
      expect(sdk.status).toBe(CONNECTOR_STATUS.ERRORED);
    });

    expect(sdk.primaryConnectorName).toBeNull();
    expect(sdk.idToken).toBeNull();
    expect(sdk.accessToken).toBeNull();
    expect(sdk.refreshToken).toBeNull();
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
      primaryConnectorName: WALLET_CONNECTORS.METAMASK,
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
    const ethereumProvider = { request: vi.fn() };
    const commonJRPCProvider = { updateProviderEngineProxy: vi.fn() };
    (sdk as unknown as { commonJRPCProvider: Record<string, unknown> }).commonJRPCProvider = commonJRPCProvider;
    const connector = new MockConnector({ name: WALLET_CONNECTORS.METAMASK } as never, {
      connected: {
        connectorName: WALLET_CONNECTORS.METAMASK,
        ethereumProvider: ethereumProvider as never,
        solanaWallet: null,
        reconnected: false,
      },
    });
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [connector];
    sdk.exposeSubscribeToConnectorEvents(connector);

    await expect(sdk.connectTo(WALLET_CONNECTORS.METAMASK)).resolves.toEqual({
      connectorName: WALLET_CONNECTORS.METAMASK,
      ethereumProvider: commonJRPCProvider as never,
      solanaWallet: null,
    });
  });

  it("connectTo resolves in connect-and-sign mode after CONNECTED and AUTHORIZED", async () => {
    const sdk = createSdk({ initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN });
    const ethereumProvider = { request: vi.fn() };
    const commonJRPCProvider = { updateProviderEngineProxy: vi.fn() };
    (sdk as unknown as { commonJRPCProvider: Record<string, unknown> }).commonJRPCProvider = commonJRPCProvider;
    const connector = new MockConnector({ name: WALLET_CONNECTORS.METAMASK } as never, {
      connected: {
        connectorName: WALLET_CONNECTORS.METAMASK,
        ethereumProvider: ethereumProvider as never,
        solanaWallet: null,
        reconnected: false,
      },
      authorized: {
        authTokenInfo: { idToken: "id-token" },
        connector: WALLET_CONNECTORS.METAMASK,
      },
    });
    (sdk as unknown as { connectors: MockConnector[] }).connectors = [connector];
    sdk.exposeSubscribeToConnectorEvents(connector);

    await expect(sdk.connectTo(WALLET_CONNECTORS.METAMASK)).resolves.toEqual({
      connectorName: WALLET_CONNECTORS.METAMASK,
      ethereumProvider: commonJRPCProvider as never,
      solanaWallet: null,
    });
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

  it("logout, getUserInfo, and getConnectedAccountsWithProviders throw when not connected", async () => {
    const sdk = createSdk();
    await expect(sdk.logout()).rejects.toThrow(WalletLoginError);
    await expect(sdk.getUserInfo()).rejects.toThrow(WalletLoginError);
    expect(() => sdk.getConnectedAccountsWithProviders()).toThrow(WalletLoginError);
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
      primaryConnectorName: null,
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

function createExternalAccount(overrides: Partial<LinkedAccountInfo> = {}): LinkedAccountInfo {
  return {
    id: "linked-account-id",
    isPrimary: false,
    active: true,
    accountType: "external_wallet",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    eoaAddress: "0x1234567890abcdef1234567890abcdef12345678",
    connector: WALLET_CONNECTORS.METAMASK,
    authConnectionId: null,
    groupedAuthConnectionId: null,
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    ...overrides,
  };
}

function createPrimaryAccount(overrides: Partial<LinkedAccountInfo> = {}): LinkedAccountInfo {
  return {
    id: "primary-account-id",
    isPrimary: true,
    active: true,
    accountType: "social",
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    eoaAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    connector: WALLET_CONNECTORS.AUTH,
    authConnectionId: "web3auth",
    groupedAuthConnectionId: null,
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    ...overrides,
  };
}
