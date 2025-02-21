import { createEventEmitterProxy } from "@toruslabs/base-controllers";
import { JRPCEngine, providerErrors, providerFromEngine } from "@web3auth/auth";

import { SafeEventEmitterProvider } from "@/core/base";

import { BaseProvider, BaseProviderConfig, BaseProviderState } from "./baseProvider";
import { createJsonRpcClient } from "./jrpcClient";

export type CommonJRPCProviderConfig = BaseProviderConfig;

export type CommonJRPCProviderState = BaseProviderState;

export class CommonJRPCProvider extends BaseProvider<CommonJRPCProviderConfig, CommonJRPCProviderState, never> {
  constructor({ config, state }: { config: CommonJRPCProviderConfig; state?: CommonJRPCProviderState }) {
    super({ config, state });
  }

  public static getProviderInstance = async (params: {
    getCurrentChain: BaseProviderConfig["getCurrentChain"];
    getChain: BaseProviderConfig["getChain"];
  }): Promise<CommonJRPCProvider> => {
    const providerFactory = new CommonJRPCProvider({ config: { getCurrentChain: params.getCurrentChain, getChain: params.getChain } });
    const { chainId } = params.getCurrentChain();
    await providerFactory.setupProvider(chainId);
    return providerFactory;
  };

  public async setupProvider(chainId: string): Promise<void> {
    const chain = this.config.getChain(chainId);
    if (!chain) throw providerErrors.custom({ message: "Chain not found", code: 4902 });
    const { networkMiddleware } = createJsonRpcClient(chain);
    const engine = new JRPCEngine();
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);

    this.emit("chainChanged", chainId);
    this.emit("connect", { chainId });
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });

    const newChainId = params.chainId;
    if (this.config.getCurrentChain().chainId === newChainId) return;

    await this.setupProvider(newChainId);
  }

  public updateProviderEngineProxy(provider: SafeEventEmitterProvider) {
    if (this._providerEngineProxy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this._providerEngineProxy as any).setTarget(provider);
    } else {
      this._providerEngineProxy = createEventEmitterProxy<SafeEventEmitterProvider>(provider);
    }
  }

  protected getProviderEngineProxy(): SafeEventEmitterProvider | null {
    return this._providerEngineProxy;
  }

  protected lookupNetwork(): Promise<string | void> {
    throw new Error("Method not implemented.");
  }
}
