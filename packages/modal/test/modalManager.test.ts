import { afterEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@web3auth/no-modal", async () => {
  const actual = await vi.importActual<typeof import("../../no-modal/src")>("../../no-modal/src");
  return actual;
});

import {
  CHAIN_NAMESPACES,
  CONNECTED_STATUSES,
  type ConnectedAccountInfo,
  Connection,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  type LinkAccountResult,
  type ProjectConfig,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthNoModal,
} from "@web3auth/no-modal";

import { Web3Auth, type Web3AuthOptions } from "../src/modalManager";
import { LOGIN_MODAL_EVENTS } from "../src/ui";
import { createModalProjectConfig, createWalletRegistry } from "./helpers";

class TestWeb3Auth extends Web3Auth {
  public exposeInitUIConfig(projectConfig: ProjectConfig) {
    this.initUIConfig(projectConfig);
  }

  public exposeGetInitializationTrackData() {
    return this.getInitializationTrackData();
  }
}

function createSdk(overrides: Partial<Web3AuthOptions> = {}) {
  return new TestWeb3Auth({
    clientId: "test-client-id",
    web3AuthNetwork: "sapphire_devnet",
    chains: [
      {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x1",
        rpcTarget: "https://rpc.ankr.com/eth",
        displayName: "Ethereum Mainnet",
        ticker: "ETH",
        tickerName: "Ethereum",
      },
    ],
    storage: {
      sessionId: {
        async get(): Promise<null> {
          return null;
        },
        async set() {},
        async resetStore() {},
      },
    },
    ...overrides,
  } as never);
}

function createConnectedWalletAccount(overrides: Partial<ConnectedAccountInfo> = {}): ConnectedAccountInfo {
  return {
    id: "wallet-1",
    accountType: "external_wallet",
    address: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
    authConnectionId: null,
    chainNamespace: "evm",
    isPrimary: false,
    eoaAddress: "0xAbCdEf0123456789aBCdEf0123456789abCDef01",
    connector: WALLET_CONNECTORS.WALLET_CONNECT_V2,
    active: false,
    ...overrides,
  };
}

describe("Web3Auth (modal)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extends Web3AuthNoModal and sets constructor defaults", () => {
    const sdk = createSdk();
    expect(sdk).toBeInstanceOf(Web3AuthNoModal);
    expect(sdk.options.initialAuthenticationMode).toBe(CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN);
    expect(sdk.options.uiConfig).toEqual({});
  });

  it("applies custom uiConfig and modalConfig from constructor", () => {
    const sdk = createSdk({
      uiConfig: { mode: "dark" },
      modalConfig: { hideWalletDiscovery: true, connectors: {} },
    });
    expect(sdk.options.uiConfig?.mode).toBe("dark");
    expect((sdk as unknown as { modalConfig: { hideWalletDiscovery: boolean } }).modalConfig.hideWalletDiscovery).toBe(true);
  });

  it("connect throws when login modal is not initialized", async () => {
    const sdk = createSdk();
    await expect(sdk.connect()).rejects.toThrow(WalletInitializationError);
  });

  it("connect returns existing connection when already connected", async () => {
    const sdk = createSdk();
    const open = vi.fn();
    (sdk as unknown as { loginModal: { open: () => void } }).loginModal = { open };
    (sdk as unknown as { state: Record<string, unknown> }).state = {
      connectedConnectorName: WALLET_CONNECTORS.AUTH,
      cachedConnector: null,
      currentChainId: "0x1",
      idToken: null,
      accessToken: null,
      refreshToken: null,
    };
    (sdk as unknown as { currentConnection: Record<string, unknown> }).currentConnection = {
      ethereumProvider: {},
      solanaWallet: null,
      connectorName: WALLET_CONNECTORS.AUTH,
    };
    sdk.status = CONNECTED_STATUSES[0];

    const connection = await sdk.connect();
    expect(connection).toEqual((sdk as unknown as { currentConnection: Record<string, unknown> }).currentConnection);
    expect(open).not.toHaveBeenCalled();
  });

  it("connect opens modal and resolves on AUTHORIZED in connect-and-sign mode", async () => {
    const sdk = createSdk({
      initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
    });
    const open = vi.fn();
    (sdk as unknown as { loginModal: { open: () => void } }).loginModal = { open };

    const promise = sdk.connect();
    expect(open).toHaveBeenCalledOnce();
    sdk.emit(CONNECTOR_EVENTS.AUTHORIZED, { connector: WALLET_CONNECTORS.AUTH, authTokenInfo: { idToken: "id-token" } });
    await expect(promise).resolves.toBeNull();
  });

  it("connect opens modal and resolves on CONNECTED in connect-only mode", async () => {
    const sdk = createSdk({
      initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_ONLY,
    });
    const open = vi.fn();
    (sdk as unknown as { loginModal: { open: () => void } }).loginModal = { open };

    const promise = sdk.connect();
    expect(open).toHaveBeenCalledOnce();
    sdk.emit(CONNECTOR_EVENTS.CONNECTED, {
      connectorName: WALLET_CONNECTORS.AUTH,
      ethereumProvider: null,
      solanaWallet: null,
      reconnected: false,
      loginMode: "modal",
    });
    await expect(promise).resolves.toBeNull();
  });

  it("connect resolves on CONSENT_ACCEPTED when consent is required", async () => {
    const sdk = createSdk({
      uiConfig: {
        consentConfig: { required: true },
        privacyPolicy: "https://example.com/privacy",
        tncLink: "https://example.com/terms",
      } as never,
    });
    const open = vi.fn();
    (sdk as unknown as { loginModal: { open: () => void } }).loginModal = { open };

    const promise = sdk.connect();
    expect(open).toHaveBeenCalledOnce();
    sdk.emit(CONNECTOR_EVENTS.CONSENT_ACCEPTED, {
      reconnected: false,
    });
    await expect(promise).resolves.toBeNull();
  });

  it("connect rejects on ERRORED event", async () => {
    const sdk = createSdk();
    (sdk as unknown as { loginModal: { open: () => void } }).loginModal = { open: vi.fn() };

    const promise = sdk.connect();
    sdk.emit(CONNECTOR_EVENTS.ERRORED, WalletLoginError.connectionError("failed") as never, "modal");
    await expect(promise).rejects.toThrow("failed");
  });

  it("connect rejects if user closes modal before connecting", async () => {
    const sdk = createSdk();
    (sdk as unknown as { loginModal: { open: () => void } }).loginModal = { open: vi.fn() };

    const promise = sdk.connect();
    sdk.emit(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, false);
    await expect(promise).rejects.toThrow("User closed the modal");
  });

  it("switchAccount reuses an already-connected WalletConnect signer without reopening modal", async () => {
    const sdk = createSdk();
    const targetAccount = createConnectedWalletAccount();
    const switchResult = {
      kind: "external" as const,
      targetAccount,
      activeAccount: { ...targetAccount, active: true },
      activeChainId: "0x1",
    };
    const authConnector = {
      switchAccount: vi.fn().mockResolvedValue(switchResult),
      trackSwitchAccountCompleted: vi.fn(),
      trackSwitchAccountFailed: vi.fn(),
    };
    const existingConnector = {
      connected: true,
      provider: {},
      solanaWallet: null as unknown as Connection["solanaWallet"],
      name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
    };

    const processSwitchAccountResultSpy = vi
      // @ts-expect-error - processSwitchAccountResult is a protected method of Web3AuthNoModal, we need to mock it for testing
      .spyOn(Web3AuthNoModal.prototype as Web3AuthNoModal, "processSwitchAccountResult")
      .mockResolvedValue(undefined);
    const getProjectAndWalletConfigSpy = vi.spyOn(
      sdk as unknown as { getProjectAndWalletConfig: () => Promise<unknown> },
      "getProjectAndWalletConfig"
    );

    vi.spyOn(sdk as unknown as { getMainAuthConnector: () => unknown }, "getMainAuthConnector").mockReturnValue(authConnector as never);
    vi.spyOn(sdk as unknown as { getLinkedSigningConnector: (accountId: string) => unknown }, "getLinkedSigningConnector").mockReturnValue(
      existingConnector as never
    );

    await sdk.switchAccount(targetAccount);

    expect(getProjectAndWalletConfigSpy).not.toHaveBeenCalled();
    expect(processSwitchAccountResultSpy).toHaveBeenCalledWith(
      authConnector,
      switchResult,
      expect.objectContaining({ walletConnector: existingConnector })
    );
    expect(authConnector.trackSwitchAccountCompleted).toHaveBeenCalledWith(targetAccount);
  });

  it("switchAccount opens WalletConnect modal flow when phantom resolves to WalletConnect transport", async () => {
    const sdk = createSdk();
    const closeModal = vi.fn();
    const resetAccountLinkingSession = vi.fn();
    const updateAccountLinkingState = vi.fn();
    (
      sdk as unknown as {
        loginModal: {
          closeModal: () => void;
          resetAccountLinkingSession: () => void;
          updateAccountLinkingState: (state: unknown) => void;
        };
      }
    ).loginModal = {
      closeModal,
      resetAccountLinkingSession,
      updateAccountLinkingState,
    };

    const targetAccount = createConnectedWalletAccount({ id: "wallet-2", connector: "phantom" });
    const switchResult = {
      kind: "external" as const,
      targetAccount,
      activeAccount: { ...targetAccount, active: true },
      activeChainId: "0x1",
    };
    const authConnector = {
      switchAccount: vi.fn().mockResolvedValue(switchResult),
      trackSwitchAccountCompleted: vi.fn(),
      trackSwitchAccountFailed: vi.fn(),
    };
    const projectConfig = createModalProjectConfig({
      externalWalletAuth: {} as never,
    });
    const connector = {
      name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
      connected: false,
      connect: vi.fn().mockResolvedValue({
        connectorName: WALLET_CONNECTORS.WALLET_CONNECT_V2,
        ethereumProvider: {},
        solanaWallet: null,
      }),
      disconnect: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    const processSwitchAccountResultSpy = vi
      // @ts-expect-error - processSwitchAccountResult is a protected method of Web3AuthNoModal, we need to mock it for testing
      .spyOn(Web3AuthNoModal.prototype as Web3AuthNoModal, "processSwitchAccountResult")
      .mockResolvedValue(undefined);
    const getProjectAndWalletConfigSpy = vi.spyOn(
      sdk as unknown as { getProjectAndWalletConfig: () => Promise<{ projectConfig: ProjectConfig }> },
      "getProjectAndWalletConfig"
    );
    getProjectAndWalletConfigSpy.mockResolvedValue({
      projectConfig,
      walletRegistry: createWalletRegistry(),
    } as never);
    const prepareAccountSwitchConnectorSpy = vi.spyOn(
      sdk as unknown as {
        prepareAccountSwitchConnector: (connectorName: string, chainId: string, config?: ProjectConfig) => Promise<unknown>;
      },
      "prepareAccountSwitchConnector"
    );
    prepareAccountSwitchConnectorSpy.mockResolvedValue(connector as never);

    vi.spyOn(sdk as unknown as { getMainAuthConnector: () => unknown }, "getMainAuthConnector").mockReturnValue(authConnector as never);
    vi.spyOn(sdk as unknown as { getLinkedSigningConnector: (accountId: string) => unknown }, "getLinkedSigningConnector").mockReturnValue(null);

    await sdk.switchAccount(targetAccount);

    expect(getProjectAndWalletConfigSpy).toHaveBeenCalledOnce();
    expect(prepareAccountSwitchConnectorSpy).toHaveBeenCalledWith("phantom", "0x1", projectConfig);
    expect(connector.connect).toHaveBeenCalledWith({ chainId: "0x1" });
    expect(processSwitchAccountResultSpy).toHaveBeenCalledWith(
      authConnector,
      switchResult,
      expect.objectContaining({
        walletConnector: connector,
        projectConfig,
      })
    );
    expect(closeModal).toHaveBeenCalledOnce();
    expect(resetAccountLinkingSession).toHaveBeenCalledOnce();
    expect(updateAccountLinkingState).toHaveBeenCalled();
    expect(authConnector.trackSwitchAccountCompleted).toHaveBeenCalledWith(targetAccount);
  });

  it("linkAccount routes phantom through WalletConnect modal flow when the resolved transport is WalletConnect", async () => {
    const sdk = createSdk();
    const walletConnectConnector = {
      name: WALLET_CONNECTORS.WALLET_CONNECT_V2,
    };
    const result: LinkAccountResult = {
      success: true,
      idToken: "linked-id-token",
      linkedAccounts: [],
    };

    const prepareAccountLinkingConnectorSpy = vi.spyOn(
      sdk as unknown as {
        prepareAccountLinkingConnector: (connectorName: string, chainId: string) => Promise<unknown>;
      },
      "prepareAccountLinkingConnector"
    );
    prepareAccountLinkingConnectorSpy.mockResolvedValue(walletConnectConnector as never);
    const runWalletConnectV2AccountActionSpy = vi.spyOn(
      sdk as unknown as {
        runWalletConnectV2AccountAction: (params: unknown) => Promise<LinkAccountResult>;
      },
      "runWalletConnectV2AccountAction"
    );
    runWalletConnectV2AccountActionSpy.mockResolvedValue(result);
    // @ts-expect-error - linkAccountWithConnector is a protected method of Web3AuthNoModal
    const linkAccountWithConnectorSpy = vi.spyOn(Web3AuthNoModal.prototype as Web3AuthNoModal, "linkAccountWithConnector");

    const response = await sdk.linkAccount({ connectorName: "phantom", chainId: "0x1" });

    expect(prepareAccountLinkingConnectorSpy).toHaveBeenCalledWith("phantom", "0x1");
    expect(runWalletConnectV2AccountActionSpy).toHaveBeenCalledOnce();
    expect(linkAccountWithConnectorSpy).not.toHaveBeenCalled();
    expect(response).toEqual(result);
  });

  it("linkAccount links phantom directly when the resolved transport is installed", async () => {
    const sdk = createSdk();
    const phantomConnector = {
      name: "phantom",
    };
    const result: LinkAccountResult = {
      success: true,
      idToken: "linked-id-token",
      linkedAccounts: [],
    };

    const prepareAccountLinkingConnectorSpy = vi.spyOn(
      sdk as unknown as {
        prepareAccountLinkingConnector: (connectorName: string, chainId: string) => Promise<unknown>;
      },
      "prepareAccountLinkingConnector"
    );
    prepareAccountLinkingConnectorSpy.mockResolvedValue(phantomConnector as never);
    const runWalletConnectV2AccountActionSpy = vi.spyOn(
      sdk as unknown as {
        runWalletConnectV2AccountAction: (params: unknown) => Promise<LinkAccountResult>;
      },
      "runWalletConnectV2AccountAction"
    );
    // @ts-expect-error - linkAccountWithConnector is a private method of Web3AuthNoModal
    const linkAccountWithConnectorSpy = vi.spyOn(Web3AuthNoModal.prototype as Web3AuthNoModal, "linkAccountWithConnector");
    // @ts-expect-error - mock for testing
    linkAccountWithConnectorSpy.mockResolvedValue(result);

    const response = await sdk.linkAccount({ connectorName: "phantom", chainId: "0x1" });

    expect(prepareAccountLinkingConnectorSpy).toHaveBeenCalledWith("phantom", "0x1");
    expect(linkAccountWithConnectorSpy).toHaveBeenCalledWith("phantom", "0x1", phantomConnector);
    expect(runWalletConnectV2AccountActionSpy).not.toHaveBeenCalled();
    expect(response).toEqual(result);
  });

  it("initUIConfig merges whitelabel + ui config and deduplicates loginMethodsOrder", () => {
    const sdk = createSdk({
      uiConfig: {
        mode: "dark",
        loginMethodsOrder: ["google", "apple", "google"],
      } as never,
    });

    const projectConfig = createModalProjectConfig({
      whitelabel: { appName: "Test App" } as never,
      embeddedWalletAuth: [
        { authConnection: "google", isDefault: true },
        { authConnection: "discord", isDefault: true },
      ] as never,
      loginModal: {
        loginGridCol: 2,
      } as never,
    });

    sdk.exposeInitUIConfig(projectConfig);
    expect(sdk.options.uiConfig?.mode).toBe("dark");
    expect(sdk.options.uiConfig?.appName).toBe("Test App");
    expect(sdk.options.uiConfig?.loginGridCol).toBe(2);
    expect(sdk.options.uiConfig?.loginMethodsOrder).toEqual(["google", "apple", "discord"]);
  });

  it("filterWalletRegistry removes disabled wallets and always keeps MetaMask", () => {
    const sdk = createSdk();
    const walletRegistry = createWalletRegistry();
    const projectConfig = createModalProjectConfig({
      externalWalletAuth: {
        disableAllRecommendedWallets: true,
        disableAllOtherWallets: true,
        disabledWallets: [WALLET_CONNECTORS.METAMASK],
      },
    });

    const { filteredWalletRegistry, disabledExternalWallets } = (
      sdk as unknown as {
        filterWalletRegistry: (
          walletRegistryArg: ReturnType<typeof createWalletRegistry>,
          projectConfigArg: ReturnType<typeof createModalProjectConfig>
        ) => {
          disabledExternalWallets: Set<string>;
          filteredWalletRegistry: ReturnType<typeof createWalletRegistry>;
        };
      }
    ).filterWalletRegistry(walletRegistry, projectConfig);

    expect(disabledExternalWallets.has(WALLET_CONNECTORS.METAMASK)).toBe(false);
    expect(filteredWalletRegistry.default[WALLET_CONNECTORS.METAMASK]).toBeDefined();
    expect(filteredWalletRegistry.default[WALLET_CONNECTORS.COINBASE]).toBeUndefined();
    expect(filteredWalletRegistry.others[WALLET_CONNECTORS.WALLET_CONNECT_V2]).toBeUndefined();
  });

  it("getInitializationTrackData includes modal-specific fields", () => {
    const sdk = createSdk({
      uiConfig: {
        loginMethodsOrder: ["google"],
        modalZIndex: 9999,
      } as never,
      modalConfig: {
        hideWalletDiscovery: true,
        connectors: {
          [WALLET_CONNECTORS.AUTH]: {
            label: "Auth",
            loginMethods: {
              google: { showOnModal: true },
            },
          },
        },
      },
    });

    const data = sdk.exposeGetInitializationTrackData();
    expect(data).toHaveProperty("modal_hide_wallet_discovery", true);
    expect(data).toHaveProperty("modal_connectors");
    expect(data).toHaveProperty("modal_auth_connector_login_methods");
    expect(data).toHaveProperty("ui_login_methods_order");
    expect(data).toHaveProperty("ui_modal_z_index", 9999);
    expect(data).toHaveProperty("logging_enabled");
  });
});
