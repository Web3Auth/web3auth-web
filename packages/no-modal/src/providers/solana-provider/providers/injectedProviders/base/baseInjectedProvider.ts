import { JRPCEngine, JRPCMiddleware, providerFromEngine } from "@web3auth/auth";

import { WalletLoginError } from "@/core/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@/core/base-provider";

import { ISolanaProviderHandlers } from "../../../rpc";
import { createConfigMiddleware } from "../../../rpc/JrpcClient";
import { createSolanaMiddleware } from "../../../rpc/solanaRpcMiddlewares";

export abstract class BaseInjectedProvider<P> extends BaseProvider<BaseProviderConfig, BaseProviderState, P> {
  constructor({ config, state }: { config: BaseProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
  }

  public async switchChain(_: { chainId: string }): Promise<void> {
    throw WalletLoginError.unsupportedOperation("Chain switching is not supported by this connector");
  }

  public async setupProvider(injectedProvider: P, chainId: string): Promise<void> {
    const engine = new JRPCEngine();
    const chain = this.getChain(chainId);

    const providerHandlers = this.getProviderHandlers(injectedProvider);
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    engine.push(solanaMiddleware);

    const configMiddleware = createConfigMiddleware(chain);
    engine.push(configMiddleware);

    const injectedProviderProxy = this.getInjectedProviderProxy(injectedProvider);
    if (injectedProviderProxy) {
      engine.push(injectedProviderProxy);
    }

    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    await this.lookupNetwork(injectedProvider, chainId);
  }

  protected async lookupNetwork(_injectedProvider: P, chainId: string): Promise<string> {
    this.update({
      chainId,
    });
    return chainId || "";
  }

  protected getInjectedProviderProxy(_: P): JRPCMiddleware<unknown, unknown> {
    return undefined;
  }

  protected abstract getProviderHandlers(injectedProvider: P): ISolanaProviderHandlers;
}
