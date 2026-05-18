import { describe, expect, it, vi } from "vitest";

import { type SafeEventEmitterProvider } from "../src/base";
import { BaseProvider, type BaseProviderConfig, type BaseProviderState } from "../src/providers/base-provider";
import { createChain } from "./helpers";

class TestBaseProvider extends BaseProvider<BaseProviderConfig, BaseProviderState, never> {
  async setupProvider(_provider: never, _chainId: string): Promise<void> {}

  async switchChain(_params: { chainId: string }): Promise<void> {}

  protected async lookupNetwork(): Promise<string | void> {
    return this.chainId;
  }
}

class MinimalEip1193Provider {
  public chainId = "0x1";

  public request = vi.fn(async ({ method }: { method: string }) => `${this.name}:${method}`);

  public sendAsync = vi.fn();

  public send = vi.fn();

  private listeners = new Map<string | symbol, Set<(...args: unknown[]) => void>>();

  constructor(private readonly name: string) {}

  public on(event: string | symbol, listener: (...args: unknown[]) => void): () => void {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return () => this.removeListener(event, listener);
  }

  public once(event: string | symbol, listener: (...args: unknown[]) => void): () => void {
    const wrappedListener = (...args: unknown[]) => {
      this.removeListener(event, wrappedListener);
      listener(...args);
    };
    return this.on(event, wrappedListener);
  }

  public removeListener(event: string | symbol, listener: (...args: unknown[]) => void): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    listeners.delete(listener);
    if (listeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  public emit(event: string | symbol, ...args: unknown[]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    listeners.forEach((listener) => listener(...args));
  }
}

describe("BaseProvider", () => {
  it("rebinds EIP-1193 providers without eventNames and preserves old provider listeners", async () => {
    const chain = createChain();
    const provider = new TestBaseProvider({ config: { chain, chains: [chain] } });
    const oldTarget = new MinimalEip1193Provider("old-target");
    const newTarget = new MinimalEip1193Provider("new-target");

    const wrapperAccountsChanged = vi.fn();
    const wrapperChainChanged = vi.fn();
    const oldTargetNativeListener = vi.fn();

    oldTarget.on("accountsChanged", oldTargetNativeListener);

    provider.updateProviderEngineProxy(oldTarget as unknown as SafeEventEmitterProvider);
    provider.on("accountsChanged", wrapperAccountsChanged);
    provider.on("chainChanged", wrapperChainChanged);

    oldTarget.emit("accountsChanged", ["0xold"]);
    oldTarget.emit("chainChanged", "0x2");

    expect(wrapperAccountsChanged).toHaveBeenCalledTimes(1);
    expect(oldTargetNativeListener).toHaveBeenCalledTimes(1);
    expect(wrapperChainChanged).toHaveBeenCalledTimes(1);
    expect(provider.chainId).toBe("0x2");
    await expect(provider.request({ method: "eth_accounts" })).resolves.toBe("old-target:eth_accounts");

    expect(() => provider.updateProviderEngineProxy(newTarget as unknown as SafeEventEmitterProvider)).not.toThrow();
    await expect(provider.request({ method: "eth_accounts" })).resolves.toBe("new-target:eth_accounts");

    oldTarget.emit("accountsChanged", ["0xstale"]);
    expect(wrapperAccountsChanged).toHaveBeenCalledTimes(1);
    expect(oldTargetNativeListener).toHaveBeenCalledTimes(2);

    newTarget.emit("accountsChanged", ["0xnew"]);
    newTarget.emit("chainChanged", "0x3");

    expect(wrapperAccountsChanged).toHaveBeenCalledTimes(2);
    expect(wrapperChainChanged).toHaveBeenCalledTimes(2);
    expect(provider.chainId).toBe("0x3");
  });
});
