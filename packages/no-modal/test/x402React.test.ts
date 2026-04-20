import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CHAIN_NAMESPACES } from "../src/base";
import type { IUseX402FetchReturnValues } from "../src/x402/react";

const mockUseChain = vi.fn();
const mockUseWeb3Auth = vi.fn();

vi.mock("../src/react/hooks/useChain", () => ({
  useChain: () => mockUseChain(),
}));

vi.mock("../src/react/hooks/useWeb3Auth", () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

import { useX402Fetch } from "../src/x402/react";

let fetchWithPayment: IUseX402FetchReturnValues["fetchWithPayment"] | null = null;

function TestComponent(): null {
  fetchWithPayment = useX402Fetch().fetchWithPayment;
  return null;
}

async function renderHook() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(createElement(TestComponent));
  });

  return { root, container };
}

describe("useX402Fetch", () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    vi.clearAllMocks();
    fetchWithPayment = null;

    if (root) {
      await act(async () => {
        root.unmount();
      });
    }

    container?.remove();
    root = null;
    container = null;
  });

  it("keeps the EVM-specific missing provider error", async () => {
    mockUseChain.mockReturnValue({
      chainNamespace: CHAIN_NAMESPACES.EIP155,
    });
    mockUseWeb3Auth.mockReturnValue({
      web3Auth: null,
      isConnected: true,
      connection: null,
    });

    ({ root, container } = await renderHook());

    await expect(fetchWithPayment?.({ url: "https://example.com", options: {} })).rejects.toThrow("EVM provider not available");
  });
});
