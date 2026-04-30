import {
  CHAIN_NAMESPACES,
  CONNECTED_STATUSES,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  type ProjectConfig,
  WALLET_CONNECTORS,
  WalletInitializationError,
  WalletLoginError,
  Web3AuthNoModal,
} from "@web3auth/no-modal";
import { describe, expect, it, vi } from "vitest";

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

describe("Web3Auth (modal)", () => {
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
      connectorName: WALLET_CONNECTORS.AUTH,
      ethereumProvider: null,
      solanaWallet: null,
      reconnected: false,
      loginMode: "modal",
      pendingUserConsent: false,
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
