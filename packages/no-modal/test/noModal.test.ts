import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../src/base/account-linking", async () => {
  const actual = await vi.importActual<typeof import("../src/base/account-linking")>("../src/base/account-linking");
  return {
    ...actual,
    makeAccountUnlinkingRequest: vi.fn(),
  };
});

vi.mock("@metamask/connect-evm", () => ({
  createEVMClient: vi.fn(),
}));

vi.mock("@metamask/connect-multichain", () => ({
  createMultichainClient: vi.fn(),
  hasExtension: vi.fn(async () => false),
}));

vi.mock("@metamask/connect-solana", () => ({
  createSolanaClient: vi.fn(),
}));

vi.mock("@paulmillr/qr", () => ({}));

if (typeof window === "undefined") {
  vi.stubGlobal("window", {
    location: { origin: "http://localhost" },
  });
}

if (typeof document === "undefined") {
  vi.stubGlobal("document", {
    querySelector: (): null => null,
    querySelectorAll: (): [] => [],
  });
}

import {
  Analytics,
  CHAIN_NAMESPACES,
  CONNECTED_STATUSES,
  type ConnectedAccountInfo,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  CONNECTOR_NAMESPACES,
  CONNECTOR_STATUS,
  type IConnector,
  type WALLET_CONNECTOR_TYPE,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
} from "../src/base";
import { makeAccountUnlinkingRequest } from "../src/base/account-linking";
import { authConnector, type AuthConnectorType } from "../src/connectors/auth-connector";
import { Web3AuthNoModal } from "../src/noModal";
import { createChain, createMockStorage, createProjectConfig, MockConnector, MULTICHAIN_CONNECTOR_NAMESPACE } from "./helpers";

class TestWeb3AuthNoModal extends Web3AuthNoModal {
  public exposeInitChainsConfig(projectConfig: ReturnType<typeof createProjectConfig>) {
    this.initChainsConfig(projectConfig);
  }

  public exposeInitAccountAbstractionConfig(projectConfig: ReturnType<typeof createProjectConfig>) {
    this.initAccountAbstractionConfig(projectConfig);
  }

  public exposeSetConnectors(connectors: IConnector<unknown>[]) {
    this.setConnectors(connectors);
  }

  public exposeCheckIfAutoConnect(connector: MockConnector) {
    return this.checkIfAutoConnect(connector as unknown as IConnector<unknown>);
  }

  public exposeResolveLinkAccountChainId(chainId?: string | null) {
    return this.resolveLinkAccountChainId(chainId);
  }

  public exposeCreateLinkingWalletConnector(
    connectorName: WALLET_CONNECTOR_TYPE | string,
    chainId: string,
    projectConfig?: ReturnType<typeof createProjectConfig>
  ) {
    return this.createLinkingWalletConnector(connectorName, chainId, projectConfig);
  }

  public exposeLinkAccountWithConnector(connectorName: WALLET_CONNECTOR_TYPE | string, chainId: string, walletConnector: IConnector<unknown>) {
    return this.linkAccountWithConnector(connectorName, chainId, walletConnector);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("Web3AuthNoModal", () => {
  beforeAll(() => {
    vi.stubGlobal("window", {
      location: { origin: "http://localhost:3000" },
    });
    vi.stubGlobal("document", {
      querySelector: (): null => null,
      querySelectorAll: (): [] => [],
    });
  });

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

  it("switchAccount rejects when the connector is connected to a different linked account", async () => {
    const sdk = createSdk(
      {},
      {
        connectedConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
      }
    );
    await Promise.resolve();

    const targetAccount: ConnectedAccountInfo = {
      id: "wallet-1",
      accountType: "external_wallet",
      address: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
      authConnectionId: null,
      chainNamespace: "evm",
      isPrimary: false,
      eoaAddress: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
      connector: WALLET_CONNECTORS.METAMASK,
      active: false,
    };

    const authConnector = createAuthConnectorForSdk(sdk);
    authConnector.status = CONNECTOR_STATUS.CONNECTED;
    vi.spyOn(authConnector, "getUserInfo").mockResolvedValue({
      connectedAccounts: [targetAccount],
    });

    const provider = {
      request: vi.fn().mockResolvedValue(["0x1234567890abcdef1234567890abcdef12345678"]),
    };
    const isolatedConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      connectorNamespace: CHAIN_NAMESPACES.EIP155,
      provider,
    } as never);
    isolatedConnector.connect = vi.fn(async () => ({
      connectorName: WALLET_CONNECTORS.METAMASK,
      ethereumProvider: provider as never,
      solanaWallet: null,
    }));

    vi.spyOn(
      sdk as unknown as {
        createIsolatedWalletConnector: (connectorName: string, chainId: string) => Promise<MockConnector>;
      },
      "createIsolatedWalletConnector"
    ).mockResolvedValue(isolatedConnector);
    sdk.exposeSetConnectors([authConnector]);
    sdk.status = CONNECTED_STATUSES[0];

    await expect(sdk.switchAccount(targetAccount)).rejects.toThrow(
      `Connector "${WALLET_CONNECTORS.METAMASK}" is connected to "0x1234567890abcdef1234567890abcdef12345678" instead of linked account "${targetAccount.eoaAddress}".`
    );
  });

  it("switchAccount rejects when the target connector is unavailable", async () => {
    const sdk = createSdk(
      {},
      {
        connectedConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
      }
    );
    await Promise.resolve();

    const targetAccount: ConnectedAccountInfo = {
      id: "wallet-2",
      accountType: "external_wallet",
      address: "0x9999999999999999999999999999999999999999",
      authConnectionId: null,
      chainNamespace: "evm",
      isPrimary: false,
      eoaAddress: "0x9999999999999999999999999999999999999999",
      connector: WALLET_CONNECTORS.METAMASK,
      active: false,
    };

    const authConnector = createAuthConnectorForSdk(sdk);
    authConnector.status = CONNECTOR_STATUS.CONNECTED;
    vi.spyOn(authConnector, "getUserInfo").mockResolvedValue({
      connectedAccounts: [targetAccount],
    });

    const isolatedConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      connectorNamespace: CHAIN_NAMESPACES.EIP155,
    } as never);
    isolatedConnector.connect = vi.fn(async () => {
      throw WalletLoginError.connectionError("Injected provider is not available");
    });

    vi.spyOn(
      sdk as unknown as {
        createIsolatedWalletConnector: (connectorName: string, chainId: string) => Promise<MockConnector>;
      },
      "createIsolatedWalletConnector"
    ).mockResolvedValue(isolatedConnector);
    sdk.exposeSetConnectors([authConnector]);
    sdk.status = CONNECTED_STATUSES[0];

    await expect(sdk.switchAccount(targetAccount)).rejects.toThrow(
      `Connector "${WALLET_CONNECTORS.METAMASK}" is not available for linked account "${targetAccount.eoaAddress}".`
    );
  });

  it("linkAccount uses the active chain, isolated connector, and persists refreshed idToken", async () => {
    const sdk = createSdk(
      {},
      {
        connectedConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        idToken: "session-id-token",
        accessToken: "access-token",
      }
    );
    await Promise.resolve();

    const authConnector = createAuthConnectorForSdk(sdk);
    authConnector.status = CONNECTOR_STATUS.CONNECTED;
    sdk.exposeSetConnectors([authConnector]);
    sdk.status = CONNECTED_STATUSES[0];

    const isolatedConnector = new MockConnector({
      name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      connectorNamespace: CONNECTOR_NAMESPACES.MULTICHAIN,
    } as never);

    vi.spyOn(
      sdk as unknown as {
        createIsolatedWalletConnector: (connectorName: string, chainId: string) => Promise<MockConnector>;
      },
      "createIsolatedWalletConnector"
    ).mockResolvedValue(isolatedConnector);

    const linkAccountSpy = vi.spyOn(authConnector, "linkAccount").mockResolvedValue({
      success: true,
      idToken: "refreshed-id-token",
      linkedAccounts: [],
    });

    const result = await sdk.linkAccount({ connectorName: WALLET_CONNECTORS.WALLET_CONNECT_V2 });

    expect(
      (
        sdk as unknown as {
          state: { idToken: string | null };
        }
      ).state.idToken
    ).toBe("refreshed-id-token");
    expect(result).toEqual({
      success: true,
      idToken: "refreshed-id-token",
      linkedAccounts: [],
    });
    expect(linkAccountSpy).toHaveBeenCalledWith({
      connectorName: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      chainId: "0x1",
      walletConnector: isolatedConnector,
      authSessionTokens: {
        accessToken: "access-token",
        idToken: "session-id-token",
      },
    });
  });

  it("resolveLinkAccountChainId throws when no explicit or active chain is available", () => {
    const sdk = createSdk({}, { currentChainId: null });

    expect(() => sdk.exposeResolveLinkAccountChainId()).toThrow(
      "No chainId is available. Please specify chainId in LinkAccountParams or ensure the SDK has an active chain."
    );
  });

  it("createLinkingWalletConnector resolves phantom to an installed injected EVM connector on EVM chains", async () => {
    const sdk = createSdk();
    const projectConfig = createProjectConfig({ externalWalletAuth: {} as never });
    const phantomConnector = new MockConnector({
      name: "phantom",
      connectorNamespace: CHAIN_NAMESPACES.EIP155,
    } as never);
    const injectedEvmModule = await import("../src/connectors/injected-evm-connector");
    const walletConnectModule = await import("../src/connectors/wallet-connect-v2-connector");

    vi.spyOn(injectedEvmModule, "createMipd").mockReturnValue({
      getProviders: () => [{ info: { name: "Phantom" }, provider: {} }],
    } as never);
    vi.spyOn(injectedEvmModule, "injectedEvmConnector").mockReturnValue(() => phantomConnector);
    const walletConnectSpy = vi.spyOn(walletConnectModule, "walletConnectV2Connector");

    const connector = await sdk.exposeCreateLinkingWalletConnector("phantom", "0x1", projectConfig);

    expect(connector).toBe(phantomConnector);
    expect(walletConnectSpy).not.toHaveBeenCalled();
  });

  it("createLinkingWalletConnector resolves phantom to an installed Wallet Standard connector on Solana chains", async () => {
    const solanaChain = createChain({
      chainNamespace: CHAIN_NAMESPACES.SOLANA,
      chainId: "0x2",
      rpcTarget: "https://api.mainnet-beta.solana.com",
      displayName: "Solana",
      ticker: "SOL",
      tickerName: "Solana",
    });
    const sdk = createSdk({ chains: [solanaChain] });
    const projectConfig = createProjectConfig({ chains: [solanaChain], externalWalletAuth: {} as never });
    const phantomConnector = new MockConnector({
      name: "phantom",
      connectorNamespace: CHAIN_NAMESPACES.SOLANA,
    } as never);
    const solanaModule = await import("../src/connectors/injected-solana-connector");
    const walletConnectModule = await import("../src/connectors/wallet-connect-v2-connector");
    const phantomWallet = { name: "Phantom" };

    vi.spyOn(solanaModule, "createSolanaMipd").mockReturnValue({
      get: () => [phantomWallet],
    } as never);
    vi.spyOn(solanaModule, "hasSolanaWalletStandardFeatures").mockImplementation((wallet) => wallet === phantomWallet);
    vi.spyOn(solanaModule, "walletStandardConnector").mockReturnValue(() => phantomConnector);
    const walletConnectSpy = vi.spyOn(walletConnectModule, "walletConnectV2Connector");

    const connector = await sdk.exposeCreateLinkingWalletConnector("phantom", "0x2", projectConfig);

    expect(connector).toBe(phantomConnector);
    expect(walletConnectSpy).not.toHaveBeenCalled();
  });

  it("createLinkingWalletConnector falls back to WalletConnect for phantom when no installed connector is available", async () => {
    const sdk = createSdk();
    const projectConfig = createProjectConfig({ externalWalletAuth: {} as never });
    const walletConnectConnector = new MockConnector({
      name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      connectorNamespace: CONNECTOR_NAMESPACES.MULTICHAIN,
    } as never);
    const injectedEvmModule = await import("../src/connectors/injected-evm-connector");
    const walletConnectModule = await import("../src/connectors/wallet-connect-v2-connector");

    vi.spyOn(injectedEvmModule, "createMipd").mockReturnValue({
      getProviders: (): unknown[] => [],
    } as never);
    vi.spyOn(injectedEvmModule, "injectedEvmConnector");
    vi.spyOn(walletConnectModule, "walletConnectV2Connector").mockReturnValue(() => walletConnectConnector);

    const connector = await sdk.exposeCreateLinkingWalletConnector("phantom", "0x1", projectConfig);

    expect(connector).toBe(walletConnectConnector);
    expect(connector.name).toBe(WALLET_CONNECTORS.WALLET_CONNECT_V2);
  });

  it("linkAccountWithConnector persists refreshed idToken from already-connected wallet flow", async () => {
    const sdk = createSdk(
      {},
      {
        connectedConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        idToken: "session-id-token",
        accessToken: "access-token",
      }
    );
    await Promise.resolve();

    const authConnector = createAuthConnectorForSdk(sdk);
    authConnector.status = CONNECTOR_STATUS.CONNECTED;
    sdk.exposeSetConnectors([authConnector]);
    sdk.status = CONNECTED_STATUSES[0];

    const connectedWalletConnector = new MockConnector({
      name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      connectorNamespace: CONNECTOR_NAMESPACES.MULTICHAIN,
    } as never);
    connectedWalletConnector.status = CONNECTOR_STATUS.CONNECTED;

    const linkAccountSpy = vi.spyOn(authConnector, "linkAccount").mockResolvedValue({
      success: true,
      idToken: "connected-wallet-id-token",
      linkedAccounts: [],
    });

    const result = await sdk.exposeLinkAccountWithConnector(WALLET_CONNECTORS.WALLET_CONNECT_V2, "0x1", connectedWalletConnector);

    expect(linkAccountSpy).toHaveBeenCalledWith({
      connectorName: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      chainId: "0x1",
      walletConnector: connectedWalletConnector,
      authSessionTokens: {
        accessToken: "access-token",
        idToken: "session-id-token",
      },
    });
    expect(result).toEqual({
      success: true,
      idToken: "connected-wallet-id-token",
      linkedAccounts: [],
    });
    expect(
      (
        sdk as unknown as {
          state: { idToken: string | null };
        }
      ).state.idToken
    ).toBe("connected-wallet-id-token");
  });

  it("unlinkAccount uses the target account namespace instead of the active chain", async () => {
    const solanaChain = createChain({
      chainNamespace: CHAIN_NAMESPACES.SOLANA,
      chainId: "solana-mainnet",
      rpcTarget: "https://api.mainnet-beta.solana.com",
      displayName: "Solana Mainnet",
      ticker: "SOL",
      tickerName: "Solana",
    });
    const sdk = createSdk(
      {
        chains: [createChain(), solanaChain],
      },
      {
        connectedConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: solanaChain.chainId,
        idToken: "session-id-token",
        accessToken: "access-token",
      }
    );
    await Promise.resolve();

    const authConnector = createAuthConnectorForSdk(sdk);
    authConnector.status = CONNECTOR_STATUS.CONNECTED;
    sdk.exposeSetConnectors([authConnector]);
    sdk.status = CONNECTED_STATUSES[0];

    vi.spyOn(authConnector, "getUserInfo").mockResolvedValue({
      connectedAccounts: [
        {
          id: "wallet-1",
          accountType: "external_wallet",
          address: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
          authConnectionId: null,
          chainNamespace: "evm",
          isPrimary: false,
          eoaAddress: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
          connector: WALLET_CONNECTORS.METAMASK,
          active: false,
        },
      ],
    });
    vi.mocked(makeAccountUnlinkingRequest).mockResolvedValue({
      success: true,
      idToken: "refreshed-id-token",
      linkedAccounts: [],
    });

    await sdk.unlinkAccount("0xAbCdEf0123456789aBCdEf0123456789abCDef01");

    expect(makeAccountUnlinkingRequest).toHaveBeenCalledWith(
      expect.any(String),
      "access-token",
      expect.objectContaining({
        idToken: "session-id-token",
        address: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
        network: "ethereum",
      })
    );
  });

  it("unlinkAccount disconnects the active linked connector and restores the AUTH connection", async () => {
    const primaryAccount: ConnectedAccountInfo = {
      id: "auth-primary",
      accountType: "social",
      address: "0x1111111111111111111111111111111111111111",
      authConnectionId: "google",
      chainNamespace: "evm",
      isPrimary: true,
      eoaAddress: "0x1111111111111111111111111111111111111111",
      connector: WALLET_CONNECTORS.AUTH,
      active: false,
    };
    const targetAccount: ConnectedAccountInfo = {
      id: "wallet-1",
      accountType: "external_wallet",
      address: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
      authConnectionId: null,
      chainNamespace: "evm",
      isPrimary: false,
      eoaAddress: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
      connector: WALLET_CONNECTORS.METAMASK,
      active: true,
    };
    const sdk = createSdk(
      {},
      {
        connectedConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        idToken: "session-id-token",
        accessToken: "access-token",
        activeAccount: targetAccount,
      }
    );
    await Promise.resolve();

    const authConnector = createAuthConnectorForSdk(sdk);
    authConnector.status = CONNECTOR_STATUS.CONNECTED;
    authConnector.privateKeyProvider = {
      chainId: "0x1",
      provider: {},
      currentChain: createChain(),
    } as never;
    sdk.exposeSetConnectors([authConnector]);
    sdk.status = CONNECTED_STATUSES[0];

    const updateProviderEngineProxy = vi.fn();
    (sdk as unknown as { commonJRPCProvider: Record<string, unknown> }).commonJRPCProvider = {
      updateProviderEngineProxy,
      removeAllListeners: vi.fn(),
    };

    const auxiliaryConnector = new MockConnector({
      name: WALLET_CONNECTORS.METAMASK,
      connectorNamespace: CHAIN_NAMESPACES.EIP155,
    } as never);
    auxiliaryConnector.status = CONNECTOR_STATUS.CONNECTED;
    const disconnectSpy = vi.fn(async () => {
      auxiliaryConnector.status = CONNECTOR_STATUS.READY;
    });
    auxiliaryConnector.disconnect = disconnectSpy;
    (sdk as unknown as { auxiliarySigningConnectorMap: Map<string, MockConnector> }).auxiliarySigningConnectorMap = new Map([
      [targetAccount.id, auxiliaryConnector],
    ]);

    vi.spyOn(authConnector, "getUserInfo").mockResolvedValue({
      connectedAccounts: [primaryAccount, targetAccount],
    });
    vi.mocked(makeAccountUnlinkingRequest).mockResolvedValue({
      success: true,
      idToken: "refreshed-id-token",
      linkedAccounts: [],
    });

    const connectionUpdatedListener = vi.fn();
    sdk.on(CONNECTOR_EVENTS.CONNECTION_UPDATED, connectionUpdatedListener);

    const result = await sdk.unlinkAccount(targetAccount.eoaAddress);

    expect(result.idToken).toBe("refreshed-id-token");
    expect(disconnectSpy).toHaveBeenCalledWith({ cleanup: true });
    expect(updateProviderEngineProxy).toHaveBeenCalledTimes(1);
    expect(connectionUpdatedListener).toHaveBeenCalledTimes(1);
    expect(sdk.connection?.connectorName).toBe(WALLET_CONNECTORS.AUTH);
    expect(
      (
        sdk as unknown as {
          state: { activeAccount: ConnectedAccountInfo | null; idToken: string | null };
          auxiliarySigningConnectorMap: Map<string, MockConnector>;
        }
      ).state.activeAccount
    ).toBeNull();
    expect(
      (
        sdk as unknown as {
          state: { activeAccount: ConnectedAccountInfo | null; idToken: string | null };
          auxiliarySigningConnectorMap: Map<string, MockConnector>;
        }
      ).state.idToken
    ).toBe("refreshed-id-token");
    expect(
      (
        sdk as unknown as {
          state: { activeAccount: ConnectedAccountInfo | null; idToken: string | null };
          auxiliarySigningConnectorMap: Map<string, MockConnector>;
        }
      ).auxiliarySigningConnectorMap.has(targetAccount.id)
    ).toBe(false);
  });

  it("unlinkAccount matches solana addresses exactly and derives the solana network", async () => {
    const sdk = createSdk(
      {
        chains: [
          createChain(),
          createChain({ chainNamespace: CHAIN_NAMESPACES.SOLANA, chainId: "solana-mainnet", rpcTarget: "https://api.mainnet-beta.solana.com" }),
        ],
      },
      {
        connectedConnectorName: WALLET_CONNECTORS.AUTH,
        currentChainId: "0x1",
        idToken: "session-id-token",
        accessToken: "access-token",
      }
    );
    await Promise.resolve();

    const authConnector = createAuthConnectorForSdk(sdk);
    authConnector.status = CONNECTOR_STATUS.CONNECTED;
    sdk.exposeSetConnectors([authConnector]);
    sdk.status = CONNECTED_STATUSES[0];

    vi.spyOn(authConnector, "getUserInfo").mockResolvedValue({
      connectedAccounts: [
        {
          id: "wallet-2",
          accountType: "external_wallet",
          address: "9xQeWvG816bUx9EPjHmaT23yvVMbJr8nnbtUb7h9V4Z",
          authConnectionId: null,
          chainNamespace: "solana",
          isPrimary: false,
          eoaAddress: "9xQeWvG816bUx9EPjHmaT23yvVMbJr8nnbtUb7h9V4Z",
          connector: WALLET_CONNECTORS.WALLET_CONNECT_V2,
          active: false,
        },
      ],
    });
    vi.mocked(makeAccountUnlinkingRequest).mockResolvedValue({
      success: true,
      idToken: "refreshed-id-token",
      linkedAccounts: [],
    });

    await sdk.unlinkAccount("9xQeWvG816bUx9EPjHmaT23yvVMbJr8nnbtUb7h9V4Z");

    expect(makeAccountUnlinkingRequest).toHaveBeenCalledWith(
      expect.any(String),
      "access-token",
      expect.objectContaining({
        idToken: "session-id-token",
        address: "9xQeWvG816bUx9EPjHmaT23yvVMbJr8nnbtUb7h9V4Z",
        network: "solana",
      })
    );
  });
});

function createSdk(overrides: Record<string, unknown> = {}, initialState?: Record<string, unknown>) {
  const storage = createMockStorage();
  return new TestWeb3AuthNoModal(
    {
      clientId: "test-client-id",
      web3AuthNetwork: "sapphire_devnet",
      chains: [createChain()],
      storage: { sessionId: storage },
      ...overrides,
    } as never,
    initialState as never
  );
}

function createAuthConnectorForSdk(sdk: Web3AuthNoModal): AuthConnectorType {
  return authConnector()({
    projectConfig: createProjectConfig({ chains: sdk.coreOptions.chains }),
    coreOptions: sdk.coreOptions,
    analytics: new Analytics(),
  }) as AuthConnectorType;
}
