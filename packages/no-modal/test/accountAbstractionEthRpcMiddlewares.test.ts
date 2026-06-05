import { describe, expect, it, vi } from "vitest";

import type { IProvider } from "../src/base";
import { DEFAULT_EIP155_METHODS } from "../src/connectors/wallet-connect-v2-connector/config";
import { providerAsMiddleware } from "../src/providers/account-abstraction-provider/rpc/ethRpcMiddlewares";

function createProvider(result: unknown): IProvider {
  return {
    chainId: "0x1",
    request: vi.fn().mockResolvedValue(result),
    sendAsync: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
    removeListener: vi.fn(),
    off: vi.fn(),
  } as unknown as IProvider;
}

describe("providerAsMiddleware", () => {
  it("normalizes undefined to null for wallet_switchEthereumChain", async () => {
    const provider = createProvider(undefined);
    const middleware = providerAsMiddleware(provider);

    await expect(
      middleware({
        request: {
          method: DEFAULT_EIP155_METHODS.SWITCH_ETHEREUM_CHAIN,
          params: [{ chainId: "0x1" }],
        },
      } as never)
    ).resolves.toBeNull();

    expect(provider.request).toHaveBeenCalledWith({
      method: DEFAULT_EIP155_METHODS.SWITCH_ETHEREUM_CHAIN,
      params: [{ chainId: "0x1" }],
    });
  });

  it("normalizes undefined to null for wallet_addEthereumChain", async () => {
    const provider = createProvider(undefined);
    const middleware = providerAsMiddleware(provider);

    await expect(
      middleware({
        request: {
          method: DEFAULT_EIP155_METHODS.ADD_ETHEREUM_CHAIN,
          params: [{ chainId: "0x1", chainName: "Ethereum", rpcUrls: ["https://rpc.example.com"] }],
        },
      } as never)
    ).resolves.toBeNull();
  });

  it("preserves null results for allowlisted methods", async () => {
    const provider = createProvider(null);
    const middleware = providerAsMiddleware(provider);

    await expect(
      middleware({
        request: {
          method: DEFAULT_EIP155_METHODS.SWITCH_ETHEREUM_CHAIN,
          params: [{ chainId: "0x1" }],
        },
      } as never)
    ).resolves.toBeNull();
  });

  it("does not coerce undefined for non-allowlisted methods", async () => {
    const provider = createProvider(undefined);
    const middleware = providerAsMiddleware(provider);

    await expect(
      middleware({
        request: {
          method: "eth_accounts",
          params: [],
        },
      } as never)
    ).resolves.toBeUndefined();
  });

  it("propagates provider errors", async () => {
    const error = new Error("switch failed");
    const provider = createProvider(null);
    vi.mocked(provider.request).mockRejectedValueOnce(error);
    const middleware = providerAsMiddleware(provider);

    await expect(
      middleware({
        request: {
          method: DEFAULT_EIP155_METHODS.SWITCH_ETHEREUM_CHAIN,
          params: [{ chainId: "0x1" }],
        },
      } as never)
    ).rejects.toThrow("switch failed");
  });
});
