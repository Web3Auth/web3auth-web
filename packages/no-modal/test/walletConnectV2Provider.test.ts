import type { ISignClient } from "@walletconnect/types";
import { describe, expect, it } from "vitest";

import { WalletConnectV2Provider } from "../src/connectors/wallet-connect-v2-connector/WalletConnectV2Provider";
import { createChain } from "./helpers";

const ACCOUNT = "0x1111111111111111111111111111111111111111";
const MAINNET = createChain({ chainId: "0x1" });
const LINEA = createChain({ chainId: "0xe708", displayName: "Linea" });

function createSignClient(approvedChains: string[]) {
  const session = {
    topic: "topic",
    peer: { metadata: {} },
    self: {},
    namespaces: {
      eip155: {
        chains: approvedChains,
        accounts: approvedChains.map((chain) => `${chain}:${ACCOUNT}`),
        methods: [] as string[],
        events: [] as string[],
      },
    },
  };
  const requestedChains: string[] = [];
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const signClient = {
    events: { on: (event: string, listener: (...args: unknown[]) => void) => listeners.set(event, listener) },
    session: { length: 1, keys: ["topic"], get: () => session },
    request: async ({ chainId }: { chainId: string }) => {
      requestedChains.push(chainId);
      if (!approvedChains.includes(chainId)) throw new Error(`Missing or invalid. request() chainId: ${chainId}`);
      return "0xhash";
    },
  };
  return { signClient: signClient as unknown as ISignClient, requestedChains };
}

async function connect(approvedChains: string[]) {
  const { signClient, requestedChains } = createSignClient(approvedChains);
  const provider = await WalletConnectV2Provider.getProviderInstance({
    connector: signClient,
    chain: MAINNET,
    chains: [MAINNET, LINEA],
    skipLookupNetwork: true,
  });
  const sendTransaction = () => provider.request({ method: "eth_sendTransaction", params: [{ from: ACCOUNT, to: ACCOUNT, value: "0x1" }] });
  return { provider, requestedChains, sendTransaction };
}

describe("WalletConnectV2Provider session chain", () => {
  it("starts on the only chain the wallet approved", async () => {
    const { provider, requestedChains, sendTransaction } = await connect(["eip155:59144"]);

    expect(await provider.request({ method: "eth_chainId" })).toBe("0xe708");
    await expect(sendTransaction()).resolves.toBe("0xhash");
    expect(requestedChains).toEqual(["eip155:59144"]);
  });

  it("keeps the configured chain when the wallet approved it", async () => {
    const { provider, requestedChains, sendTransaction } = await connect(["eip155:1", "eip155:59144"]);

    expect(await provider.request({ method: "eth_chainId" })).toBe("0x1");
    await expect(sendTransaction()).resolves.toBe("0xhash");
    expect(requestedChains).toEqual(["eip155:1"]);
  });
});
