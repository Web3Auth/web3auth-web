import { BaseConfig, BaseController, BaseState } from "@toruslabs/base-controllers";
import { JRPCRequest, JRPCResponse, ProviderEvents, rpcErrors, SendCallBack } from "@web3auth/auth";

import {
  CustomChainConfig,
  IBaseProvider,
  Maybe,
  RequestArguments,
  SafeEventEmitterProvider,
  WalletInitializationError,
  WalletProviderError,
} from "../../base";
import { BaseProviderEvents } from "./interfaces";
import { EIP1193_EVENTS } from "./utils";

export interface BaseProviderState extends BaseState {
  chainId: string;
}

export interface BaseProviderConfig extends BaseConfig {
  chain: CustomChainConfig;
  chains: CustomChainConfig[];
  skipLookupNetwork?: boolean;
  keyExportEnabled?: boolean;
}

type ProviderEventName = string | symbol;
type ProviderEventHandler = (...args: unknown[]) => void;
type ProviderEventBridge = {
  handler: ProviderEventHandler;
  detach?: () => void;
};
type RemovableProvider = SafeEventEmitterProvider<ProviderEvents> & {
  on: (event: ProviderEventName, listener: ProviderEventHandler) => unknown;
  off?: (event: ProviderEventName, listener: ProviderEventHandler) => void;
  removeListener?: (event: ProviderEventName, listener: ProviderEventHandler) => void;
};

export abstract class BaseProvider<C extends BaseProviderConfig, S extends BaseProviderState, P>
  extends BaseController<C, S, BaseProviderEvents<S>>
  implements IBaseProvider<P>
{
  // should be Assigned in setupProvider
  public _providerEngineProxy: SafeEventEmitterProvider<ProviderEvents> | null = null;

  // set to true when the keyExportEnabled flag is set by code.
  // This is to prevent the flag from being overridden by the dashboard config.
  private keyExportFlagSetByCode = false;

  private providerEventBridges = new Map<ProviderEventName, ProviderEventBridge>();

  private providerListenerBridgeRegistered = false;

  constructor({ config, state }: { config: C; state?: S }) {
    super({ config, state });
    const { chain } = config;
    if (!chain) throw WalletInitializationError.invalidProviderConfigError("Please provide chain");
    if (!chain.chainId) throw WalletInitializationError.invalidProviderConfigError("Please provide chainId inside chain");
    if (!chain.rpcTarget) throw WalletInitializationError.invalidProviderConfigError("Please provide rpcTarget inside chain");
    if (typeof config.keyExportEnabled === "boolean") this.keyExportFlagSetByCode = true;
    this.defaultState = {
      chainId: "loading",
    } as S;
    this.defaultConfig = {
      chain: config.chain,
      chains: config.chains,
      keyExportEnabled: typeof config.keyExportEnabled === "boolean" ? config.keyExportEnabled : true,
    } as C;
    super.initialize();
  }

  get currentChain(): CustomChainConfig {
    return this.config.chains.find((chain) => chain.chainId === this.state.chainId);
  }

  get provider(): SafeEventEmitterProvider<ProviderEvents> | null {
    return this._providerEngineProxy;
  }

  get chainId(): string {
    return this.state.chainId;
  }

  set provider(_) {
    throw new Error("Method not implemented.");
  }

  async request<T, R>(args: RequestArguments<T>): Promise<Maybe<R>> {
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      throw rpcErrors.invalidRequest({
        message: WalletProviderError.invalidRequestArgs().message,
        data: { ...(args || {}), cause: WalletProviderError.invalidRequestArgs().message },
      });
    }

    const { method, params } = args;

    if (typeof method !== "string" || method.length === 0) {
      throw rpcErrors.invalidRequest({
        message: WalletProviderError.invalidRequestMethod().message,
        data: { ...(args || {}), cause: WalletProviderError.invalidRequestMethod().message },
      });
    }

    if (params !== undefined && !Array.isArray(params) && (typeof params !== "object" || params === null)) {
      throw rpcErrors.invalidRequest({
        message: WalletProviderError.invalidRequestParams().message,
        data: { ...(args || {}), cause: WalletProviderError.invalidRequestParams().message },
      });
    }

    return this.provider?.request(args);
  }

  sendAsync<T, U>(req: JRPCRequest<T>, callback: SendCallBack<JRPCResponse<U>>): void;
  sendAsync<T, U>(req: JRPCRequest<T>): Promise<JRPCResponse<U>>;

  sendAsync<T, U>(req: JRPCRequest<T>, callback?: SendCallBack<JRPCResponse<U>>): void | Promise<JRPCResponse<U>> {
    if (callback) return this.send(req, callback);
    return this.request(req);
  }

  send<T, U>(req: JRPCRequest<T>, callback: SendCallBack<JRPCResponse<U>>): void {
    this.request(req)
      .then((res) => callback(null, { result: res } as JRPCResponse<U>))
      .catch((err) => callback(err, null));
  }

  public updateProviderEngineProxy(provider: SafeEventEmitterProvider): void {
    if (this._providerEngineProxy === provider) return;

    if (this._providerEngineProxy) {
      // remove all event bridges from the previous provider
      this.detachProviderEventBridges(this._providerEngineProxy);
    }

    // attach all event bridges to the new provider
    this._providerEngineProxy = provider;
    this.ensureProviderListenerBridge();

    this.eventNames().forEach((event) => {
      this.ensureProviderEventBridge(event as ProviderEventName);
    });
    this.attachProviderEventBridges(provider);
  }

  public setKeyExportFlag(flag: boolean): void {
    if (!this.keyExportFlagSetByCode) {
      this.configure({
        keyExportEnabled: flag,
      } as Partial<C>);
    }
  }

  protected getProviderEngineProxy(): SafeEventEmitterProvider | null {
    return this._providerEngineProxy;
  }

  protected getChain(chainId: string): CustomChainConfig {
    return this.config.chains.find((chain) => chain.chainId === chainId);
  }

  private ensureProviderListenerBridge(): void {
    if (this.providerListenerBridgeRegistered) return;

    this.providerListenerBridgeRegistered = true;
    this.on("newListener", ((event: string | symbol) => {
      this.ensureProviderEventBridge(event);
    }) as BaseProviderEvents<S>["newListener"]);
  }

  private ensureProviderEventBridge(event: ProviderEventName): void {
    if (event === "newListener" || event === "removeListener" || this.providerEventBridges.has(event)) return;

    const bridge: ProviderEventBridge = {
      handler: (...args) => {
        if (event === EIP1193_EVENTS.CHAIN_CHANGED) {
          const chainId = args[0] as string;
          this.update({ chainId } as Partial<S>);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.emit(event as keyof BaseProviderEvents<S>, ...(args as any));
      },
    };

    this.providerEventBridges.set(event, bridge);
    if (!this._providerEngineProxy) return;

    bridge.detach = this.attachProviderEventBridge(this._providerEngineProxy, event, bridge.handler);
  }

  private attachProviderEventBridges(provider: SafeEventEmitterProvider): void {
    this.providerEventBridges.forEach((bridge, event) => {
      if (bridge.detach) return;
      bridge.detach = this.attachProviderEventBridge(provider, event, bridge.handler);
    });
  }

  private attachProviderEventBridge(
    provider: SafeEventEmitterProvider,
    event: ProviderEventName,
    handler: ProviderEventHandler
  ): (() => void) | undefined {
    const removableProvider = provider as RemovableProvider;
    const maybeDetach = removableProvider.on(event, handler);
    return typeof maybeDetach === "function"
      ? () => {
          maybeDetach();
        }
      : undefined;
  }

  private detachProviderEventBridges(provider: SafeEventEmitterProvider): void {
    this.providerEventBridges.forEach((bridge, event) => {
      if (bridge.detach) {
        bridge.detach();
      } else {
        const removableProvider = provider as RemovableProvider;
        if (typeof removableProvider.removeListener === "function") {
          removableProvider.removeListener(event, bridge.handler);
        } else if (typeof removableProvider.off === "function") {
          removableProvider.off(event, bridge.handler);
        }
      }

      bridge.detach = undefined;
    });
  }

  abstract setupProvider(provider: P, chainId: string): Promise<void>;

  abstract switchChain(params: { chainId: string }): Promise<void>;

  protected abstract lookupNetwork(provider?: P, chainId?: string): Promise<string | void>;
}
