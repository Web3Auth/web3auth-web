import { afterEach, describe, expect, it, vi } from "vitest";

import { CHAIN_NAMESPACES, type CustomChainConfig } from "../src/base";
import { createSolanaSiwwPayload } from "../src/base/wallet/solana";

const solanaChain = (chainId: string): CustomChainConfig =>
  ({
    chainId,
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
  }) as CustomChainConfig;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createSolanaSiwwPayload", () => {
  it("uses the page host, a Solana CAIP chain id, and a single-line statement", () => {
    vi.stubGlobal("window", {
      location: {
        host: "ew-demo.metamask.io:8443",
        href: "https://ew-demo.metamask.io:8443/login",
      },
    });

    const payload = createSolanaSiwwPayload(solanaChain("0x67"), "11111111111111111111111111111111", "a1b2c3d4", "2026-09-29T00:00:00.000Z");

    expect(payload).toMatchObject({
      domain: "ew-demo.metamask.io:8443",
      uri: "https://ew-demo.metamask.io:8443/login",
      chainId: "solana:devnet",
      statement: "Sign in with your Solana account.",
    });
    expect(payload.statement).not.toMatch(/\r|\n/);
  });

  it.each([
    ["0x65", "solana:mainnet"],
    ["0x66", "solana:testnet"],
    ["0x67", "solana:devnet"],
  ])("maps %s to %s", (chainId, expectedChainId) => {
    vi.stubGlobal("window", { location: { host: "example.com", href: "https://example.com/" } });

    expect(createSolanaSiwwPayload(solanaChain(chainId), "11111111111111111111111111111111", "a1b2c3d4", "2026-09-29T00:00:00.000Z").chainId).toBe(
      expectedChainId
    );
  });
});
