import { BUILD_ENV, SafeEventEmitter } from "@web3auth/auth";
import { CHAIN_NAMESPACES, CONNECTOR_INITIAL_AUTHENTICATION_MODE, type Web3AuthNoModalEvents } from "@web3auth/no-modal";
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
        expect(document.querySelector(".w3a--fixed.w3a--w-screen")).not.toBeNull();
      },
      { timeout: 3000, interval: 50 }
    );
  });
});
