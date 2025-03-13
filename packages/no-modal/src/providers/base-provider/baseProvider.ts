import { BaseConfig, BaseController, BaseState, createEventEmitterProxy } from "@toruslabs/base-controllers";
import { JRPCRequest, JRPCResponse, ProviderEvents, rpcErrors, SendCallBack } from "@web3auth/auth";

import {
  CustomChainConfig,
  IBaseProvider,
  Maybe,
  RequestArguments,
  SafeEventEmitterProvider,
  WalletInitializationError,
  WalletProviderError,
} from "@/core/base";

import { BaseProviderEvents } from "./interfaces";

export interface BaseProviderState extends BaseState {
  chainId: string;
}

export interface BaseProviderConfig extends BaseConfig {
  chain: CustomChainConfig;
  chains: CustomChainConfig[];
  skipLookupNetwork?: boolean;
  keyExportEnabled?: boolean;
}

export interface CommonProviderEvents extends ProviderEvents {
  chainChanged: (chainId: string) => void;
}

export abstract class BaseProvider<C extends BaseProviderConfig, S extends BaseProviderState, P>
  extends BaseController<C, S, BaseProviderEvents<S>>
  implements IBaseProvider<P>
{
  // should be Assigned in setupProvider
  public _providerEngineProxy: SafeEventEmitterProvider<CommonProviderEvents> | null = null;

  // set to true when the keyExportEnabled flag is set by code.
  // This is to prevent the flag from being overridden by the dashboard config.
  private keyExportFlagSetByCode = false;

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

  get provider(): SafeEventEmitterProvider<CommonProviderEvents> | null {
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
    if (this._providerEngineProxy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this._providerEngineProxy as any).setTarget(provider);
    } else {
      // TODO: need to test if provider.on("chainChanged") & other events are re-emitted by commonjrpc provider
      this._providerEngineProxy = createEventEmitterProxy<SafeEventEmitterProvider>(provider);
    }

    this.handleChainChangedProvider();
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

  private handleChainChangedProvider() {
    // This is only added because we don't have ethereum and solana private key providers anymore
    this.provider.on("chainChanged", (chainId: string) => {
      this.update({ chainId } as Partial<S>);
      this.emit("chainChanged", chainId);
    });
  }

  abstract setupProvider(provider: P, chainId: string): Promise<void>;

  abstract switchChain(params: { chainId: string }): Promise<void>;

  protected abstract lookupNetwork(provider?: P, chainId?: string): Promise<string | void>;
}
