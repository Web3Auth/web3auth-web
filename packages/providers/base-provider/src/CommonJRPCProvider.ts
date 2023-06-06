import { createEventEmitterProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";
import { ethErrors } from "eth-rpc-errors";

import { BaseProvider, BaseProviderConfig, BaseProviderState } from "./baseProvider";
import { createJsonRpcClient } from "./jrpcClient";

export type CommonJRPCProviderConfig = BaseProviderConfig;

export type CommonJRPCProviderState = BaseProviderState;

export class CommonJRPCProvider extends BaseProvider<CommonJRPCProviderConfig, CommonJRPCProviderState, never> {
  constructor({ config, state }: { config: CommonJRPCProviderConfig; state?: CommonJRPCProviderState }) {
    super({ config, state });
  }

  public static getProviderInstance = async (params: { chainConfig: CustomChainConfig }): Promise<CommonJRPCProvider> => {
    const providerFactory = new CommonJRPCProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider();
    return providerFactory;
  };

  public async setupProvider(): Promise<void> {
    const { networkMiddleware } = createJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    const engine = new JRPCEngine();
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });
    const chainConfig = this.getChainConfig(params.chainId);
    this.update({
      chainId: "loading",
    });
    this.configure({ chainConfig });
    await this.setupProvider();
  }

  public updateProviderEngineProxy(providerEngineProxy: SafeEventEmitterProvider) {
    if (this._providerEngineProxy) {
      (this._providerEngineProxy as any).setTarget(providerEngineProxy);
    } else {
      this._providerEngineProxy = createEventEmitterProxy<SafeEventEmitterProvider>(providerEngineProxy);
    }
  }

  protected getProviderEngineProxy(): SafeEventEmitterProvider | null {
    return this._providerEngineProxy;
  }

  protected lookupNetwork(): Promise<string | void> {
    throw new Error("Method not implemented.");
  }
}
