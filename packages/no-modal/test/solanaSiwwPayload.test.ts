import { describe, expect, it } from "vitest";

import { CHAIN_NAMESPACES, type CustomChainConfig } from "../src/base";
import { createSolanaSiwwPayload } from "../src/base/wallet/solana";

const solanaChain = (chainId: string): CustomChainConfig =>
  ({
    chainId,
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
  }) as CustomChainConfig;

const createPayload = (chainId: string) =>
  createSolanaSiwwPayload(solanaChain(chainId), "11111111111111111111111111111111", "a1b2c3d4", "2026-09-29T00:00:00.000Z");

describe("createSolanaSiwwPayload", () => {
  it("uses the page host, a Solana CAIP chain id, and a single-line statement", () => {
    const payload = createPayload("0x67");

    expect(payload).toMatchObject({
      domain: window.location.host,
      uri: window.location.href,
      chainId: "solana:devnet",
      statement: "Sign in with your Solana account.",
    });
    expect(payload.domain).not.toBe(window.location.origin);
    expect(payload.statement).not.toMatch(/\r|\n/);
  });

  it.each([
    ["0x65", "solana:mainnet"],
    ["0x66", "solana:testnet"],
    ["0x67", "solana:devnet"],
  ])("maps %s to %s", (chainId, expectedChainId) => {
    expect(createPayload(chainId).chainId).toBe(expectedChainId);
  });
});
