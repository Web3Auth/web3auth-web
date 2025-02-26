import { JRPCEngine, JRPCMiddleware, providerFromEngine } from "@web3auth/auth";
import { CustomChainConfig, WalletLoginError } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";

import { IProviderHandlers } from "../../../rpc";
import { createConfigMiddleware } from "../../../rpc/JrpcClient";
import { createSolanaMiddleware } from "../../../rpc/solanaRpcMiddlewares";

export abstract class BaseInjectedProvider<P> extends BaseProvider<BaseProviderConfig, BaseProviderState, P> {
  constructor({ config, state }: { config: BaseProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
  }

  public async switchChain(_: { chainId: string }): Promise<void> {
    throw WalletLoginError.unsupportedOperation("Chain switching is not supported by this adapter");
  }

  public async setupProvider(injectedProvider: P): Promise<void> {
    const engine = new JRPCEngine();

    const providerHandlers = this.getProviderHandlers(injectedProvider);
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    engine.push(solanaMiddleware);

    const configMiddleware = createConfigMiddleware(this.config.chainConfig as CustomChainConfig);
    engine.push(configMiddleware);

    const injectedProviderProxy = this.getInjectedProviderProxy(injectedProvider);
    if (injectedProviderProxy) {
      engine.push(injectedProviderProxy);
    }

    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    await this.lookupNetwork();
  }

  protected async lookupNetwork(): Promise<string> {
    const { chainConfig } = this.config;
    this.update({
      chainId: chainConfig.chainId,
    });
    return chainConfig.chainId || "";
  }

  protected getInjectedProviderProxy(_: P): JRPCMiddleware<unknown, unknown> {
    return undefined;
  }

  protected abstract getProviderHandlers(injectedProvider: P): IProviderHandlers;
}
