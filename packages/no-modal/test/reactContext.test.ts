import { SafeEventEmitter } from "@web3auth/auth";
import { act, createElement, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import {
  CHAIN_NAMESPACES,
  type Connection,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  type CONNECTOR_STATUS_TYPE,
  CustomChainConfig,
  IPlugin,
  IWeb3Auth,
  type IWeb3AuthState,
  LOGIN_MODE,
  type Web3AuthNoModalEvents,
} from "../src/base";
import { useWeb3AuthInnerContextValue } from "../src/react/context/useWeb3AuthInnerContextValue";

type TestWeb3AuthOptions = {
  status: CONNECTOR_STATUS_TYPE;
};

type RenderSnapshot = {
  isConnected: boolean;
  isAuthorized: boolean;
  status: CONNECTOR_STATUS_TYPE | null;
};

type LiveSnapshot = RenderSnapshot & {
  connection: Connection | null;
  chainId: string | null;
  chainNamespace: CustomChainConfig["chainNamespace"] | null;
  isInitialized: boolean;
};

let latestInstance: TestWeb3Auth | null = null;

// @ts-expect-error - For testing purposes
class TestWeb3Auth extends SafeEventEmitter<Web3AuthNoModalEvents> implements IWeb3Auth {
  public status: CONNECTOR_STATUS_TYPE;

  public loginMode = LOGIN_MODE.MODAL;

  public currentChainId: string | null = null;

  public currentChain: CustomChainConfig | undefined = undefined;

  public connection: IWeb3Auth["connection"] = null;

  constructor(options: TestWeb3AuthOptions, _initialState?: IWeb3AuthState) {
    super();
    this.status = options.status;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestInstance = this;
  }

  public setAnalyticsProperties(_properties: Record<string, unknown>) {}

  public async init(_options?: { signal?: AbortSignal }) {}

  public getPlugin(_name: string): IPlugin | null {
    return null;
  }

  public async cleanup(): Promise<void> {}
}

type TestComponentProps = {
  renders: RenderSnapshot[];
  onValue?: (value: LiveSnapshot) => void;
  status: CONNECTOR_STATUS_TYPE;
};

function TestComponent({ renders, onValue, status }: TestComponentProps): null {
  const web3AuthOptions = useMemo(() => ({ status }), [status]);

  // @ts-expect-error - For testing purposes
  const value = useWeb3AuthInnerContextValue<TestWeb3Auth, TestWeb3AuthOptions>({
    Web3AuthConstructor: TestWeb3Auth,
    web3AuthOptions,
  });

  const snapshot: LiveSnapshot = {
    isConnected: value.isConnected,
    isAuthorized: value.isAuthorized,
    status: value.status,
    connection: value.connection,
    chainId: value.chainId,
    chainNamespace: value.chainNamespace,
    isInitialized: value.isInitialized,
  };
  renders.push({
    isConnected: snapshot.isConnected,
    isAuthorized: snapshot.isAuthorized,
    status: snapshot.status,
  });
  onValue?.(snapshot);

  return null;
}

async function renderHook(options: TestWeb3AuthOptions) {
  const renders: RenderSnapshot[] = [];
  const latestValue: { current: LiveSnapshot | null } = { current: null };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(TestComponent, {
        renders,
        onValue: (value: LiveSnapshot) => {
          latestValue.current = value;
        },
        status: options.status,
      })
    );
  });

  return { renders, latestValue, root, container };
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
    latestInstance = null;
  });

  it("seeds a connected first render from sdk status", async () => {
    const rendered = await renderHook({
      status: CONNECTOR_STATUS.CONNECTED,
    });
    ({ root, container } = rendered);

    expect(rendered.renders[0]).toEqual({
      isConnected: true,
      isAuthorized: false,
      status: CONNECTOR_STATUS.CONNECTED,
    });
  });

  it("seeds an authorized first render from sdk status", async () => {
    const rendered = await renderHook({
      status: CONNECTOR_STATUS.AUTHORIZED,
    });
    ({ root, container } = rendered);

    expect(rendered.renders[0]).toEqual({
      isConnected: false,
      isAuthorized: true,
      status: CONNECTOR_STATUS.AUTHORIZED,
    });
  });

  it("waits for consent acceptance before marking the hook connected", async () => {
    const rendered = await renderHook({
      status: CONNECTOR_STATUS.CONNECTING,
    });
    ({ root, container } = rendered);

    const web3Auth = latestInstance;
    expect(web3Auth).not.toBeNull();

    const connection: Connection = {
      ethereumProvider: null,
      solanaWallet: null,
      connectorName: "auth",
    };

    await act(async () => {
      web3Auth!.connection = connection;
      web3Auth!.currentChainId = "0x1";
      web3Auth!.currentChain = { chainNamespace: CHAIN_NAMESPACES.EIP155 } as CustomChainConfig;
      web3Auth!.status = CONNECTOR_STATUS.CONNECTED;
      web3Auth!.emit(CONNECTOR_EVENTS.CONNECTED, {
        ...connection,
        reconnected: false,
        pendingUserConsent: true,
        loginMode: LOGIN_MODE.MODAL,
      });
    });

    expect(rendered.latestValue.current).toMatchObject({
      isConnected: false,
      isInitialized: false,
      connection: null,
    });

    await act(async () => {
      web3Auth!.emit(CONNECTOR_EVENTS.CONSENT_ACCEPTED, { reconnected: false });
    });

    expect(rendered.latestValue.current).toMatchObject({
      isConnected: true,
      isAuthorized: false,
      isInitialized: true,
      status: CONNECTOR_STATUS.CONNECTED,
      connection,
      chainId: "0x1",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
    });
  });
});
