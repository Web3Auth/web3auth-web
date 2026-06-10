import { BUILD_ENV, SafeEventEmitter } from "@web3auth/auth";
import {
  CHAIN_NAMESPACES,
  CONNECTOR_EVENTS,
  CONNECTOR_INITIAL_AUTHENTICATION_MODE,
  LOGIN_MODE,
  WalletLoginError,
  type Web3AuthError,
  type Web3AuthNoModalEvents,
} from "@web3auth/no-modal";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginModal } from "../src/ui";
import { createWalletRegistry } from "./helpers";

function createMockAnalytics() {
  return {
    init: vi.fn(),
    identify: vi.fn(),
    setGlobalProperties: vi.fn(),
    track: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  } as never;
}

function createLoginModalInstance() {
  const connectorListener = new SafeEventEmitter<Web3AuthNoModalEvents>();
  const walletRegistry = createWalletRegistry({
    others: {},
  });

  const modal = new LoginModal(
    {
      connectorListener,
      web3authClientId: "test-client-id",
      web3authNetwork: "sapphire_devnet",
      authBuildEnv: BUILD_ENV.PRODUCTION,
      chainNamespaces: [CHAIN_NAMESPACES.EIP155],
      walletRegistry,
      analytics: createMockAnalytics(),
      initialAuthenticationMode: CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN,
      defaultLanguage: "en",
    },
    {
      onInitExternalWallets: async () => {},
      onSocialLogin: async () => {},
      onExternalWalletLogin: async () => {},
      onModalVisibility: async () => {},
      onMobileVerifyConnect: async () => {},
      onAcceptConsent: async () => {},
      onDeclineConsent: async () => {},
    }
  );

  return { modal, connectorListener };
}

describe("LoginModal (real UI)", () => {
  afterEach(() => {
    document.getElementById("w3a-parent-container")?.remove();
    document.body.style.overflow = "";
  });

  it("initModal mounts the Web3Auth container in the document", async () => {
    const { modal } = createLoginModalInstance();
    await modal.initModal();

    const container = document.getElementById("w3a-parent-container");
    expect(container).not.toBeNull();
    expect(container?.classList.contains("w3a-parent-container")).toBe(true);
  });

  it("open shows the modal overlay after init", async () => {
    const { modal } = createLoginModalInstance();
    await modal.initModal();
    modal.open();

    await vi.waitFor(
      () => {
        expect(document.querySelector(".wta\\:fixed.wta\\:w-screen")).not.toBeNull();
      },
      { timeout: 3000, interval: 50 }
    );
  });

  describe("blocked user (ERRORED code 5120)", () => {
    const BLOCKED_PRIMARY_MESSAGE = "You cannot access the site.";

    it("renders the blocked view when ERRORED fires with code 5120 in modal login mode", async () => {
      const { modal, connectorListener } = createLoginModalInstance();
      await modal.initModal();

      const blockedError = WalletLoginError.userBlocked();
      expect(blockedError.code).toBe(5120);

      connectorListener.emit(CONNECTOR_EVENTS.ERRORED, blockedError as Web3AuthError, LOGIN_MODE.MODAL);

      await vi.waitFor(
        () => {
          expect(document.body.textContent).toContain(BLOCKED_PRIMARY_MESSAGE);
        },
        { timeout: 3000, interval: 50 }
      );
    });

    it("does not render the blocked view for non-5120 errors (gated on error.code)", async () => {
      const { modal, connectorListener } = createLoginModalInstance();
      await modal.initModal();

      const genericError = WalletLoginError.fromCode(5000, "boom");
      expect(genericError.code).toBe(5000);

      connectorListener.emit(CONNECTOR_EVENTS.ERRORED, genericError as Web3AuthError, LOGIN_MODE.MODAL);

      // The 5000 branch routes to the generic ERRORED view, so the error message renders instead.
      await vi.waitFor(
        () => {
          expect(document.body.textContent).toContain("boom");
        },
        { timeout: 3000, interval: 50 }
      );
      expect(document.body.textContent).not.toContain(BLOCKED_PRIMARY_MESSAGE);
    });

    it("ignores the blocked error when loginMode is no-modal", async () => {
      const { modal, connectorListener } = createLoginModalInstance();
      await modal.initModal();

      connectorListener.emit(CONNECTOR_EVENTS.ERRORED, WalletLoginError.userBlocked() as Web3AuthError, LOGIN_MODE.NO_MODAL);

      // Give any (unexpected) async render a chance to flush before asserting absence.
      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
      expect(document.body.textContent).not.toContain(BLOCKED_PRIMARY_MESSAGE);
    });
  });
});
