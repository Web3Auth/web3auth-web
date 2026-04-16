import { SafeEventEmitter } from "@web3auth/auth";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { CONNECTOR_STATUS, type CONNECTOR_STATUS_TYPE, type IWeb3AuthLike, type IWeb3AuthState, type Web3AuthNoModalEvents } from "../src/base";
import { useWeb3AuthInnerContextValue } from "../src/react/context/useWeb3AuthInnerContextValue";

type TestWeb3AuthOptions = {
  status: CONNECTOR_STATUS_TYPE;
};

type RenderSnapshot = {
  isConnected: boolean;
  isAuthorized: boolean;
  status: CONNECTOR_STATUS_TYPE | null;
};

class TestWeb3Auth extends SafeEventEmitter<Web3AuthNoModalEvents> implements IWeb3AuthLike {
  public status: CONNECTOR_STATUS_TYPE;

  public currentChainId: string | null = null;

  public currentChain: IWeb3AuthLike["currentChain"] = null;

  public connection: IWeb3AuthLike["connection"] = null;

  constructor(options: TestWeb3AuthOptions, _initialState?: IWeb3AuthState) {
    super();
    this.status = options.status;
  }

  public setAnalyticsProperties(_properties: Record<string, unknown>) {}

  public async init(_options?: { signal?: AbortSignal }) {}

  public getPlugin(): unknown {
    return null;
  }

  public cleanup() {}
}

type TestComponentProps = {
  renders: RenderSnapshot[];
  seedStateFromStatus: boolean;
  status: CONNECTOR_STATUS_TYPE;
};

function TestComponent({ renders, seedStateFromStatus, status }: TestComponentProps): null {
  const value = useWeb3AuthInnerContextValue<TestWeb3Auth, TestWeb3AuthOptions>({
    Web3AuthConstructor: TestWeb3Auth,
    web3AuthOptions: { status },
    seedStateFromStatus,
  });

  renders.push({
    isConnected: value.isConnected,
    isAuthorized: value.isAuthorized,
    status: value.status,
  });

  return null;
}

async function renderHook(options: TestWeb3AuthOptions & { seedStateFromStatus: boolean }) {
  const renders: RenderSnapshot[] = [];
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(createElement(TestComponent, { renders, seedStateFromStatus: options.seedStateFromStatus, status: options.status }));
  });

  return { renders, root, container };
}

describe("useWeb3AuthInnerContextValue", () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }

    container?.remove();
    root = null;
    container = null;
  });

  it("seeds a connected first render from sdk status when enabled", async () => {
    const rendered = await renderHook({
      seedStateFromStatus: true,
      status: CONNECTOR_STATUS.CONNECTED,
    });
    ({ root, container } = rendered);

    expect(rendered.renders[0]).toEqual({
      isConnected: true,
      isAuthorized: false,
      status: CONNECTOR_STATUS.CONNECTED,
    });
  });

  it("seeds an authorized first render from sdk status when enabled", async () => {
    const rendered = await renderHook({
      seedStateFromStatus: true,
      status: CONNECTOR_STATUS.AUTHORIZED,
    });
    ({ root, container } = rendered);

    expect(rendered.renders[0]).toEqual({
      isConnected: false,
      isAuthorized: true,
      status: CONNECTOR_STATUS.AUTHORIZED,
    });
  });

  it("keeps the first render disconnected when seeding is disabled", async () => {
    const rendered = await renderHook({
      seedStateFromStatus: false,
      status: CONNECTOR_STATUS.CONNECTED,
    });
    ({ root, container } = rendered);

    expect(rendered.renders[0]).toEqual({
      isConnected: false,
      isAuthorized: false,
      status: null,
    });
  });
});
