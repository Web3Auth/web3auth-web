import { JRPCEngineV2, providerFromEngineV2 } from "@web3auth/auth";

import { WalletLoginError } from "../../../../../base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "../../../../../providers/base-provider";
import { ISolanaProviderHandlers } from "../../../rpc";
import { createSolanaJsonRpcClient } from "../../../rpc/JrpcClient";
import { createSolanaMiddleware } from "../../../rpc/solanaRpcMiddlewares";

export abstract class BaseInjectedProvider<P> extends BaseProvider<BaseProviderConfig, BaseProviderState, P> {
  constructor({ config, state }: { config: BaseProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
  }

  public async switchChain(_: { chainId: string }): Promise<void> {
    throw WalletLoginError.unsupportedOperation("Chain switching is not supported by this connector");
  }

  public async setupProvider(injectedProvider: P, chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    const providerHandlers = this.getProviderHandlers(injectedProvider);
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const { networkMiddleware } = createSolanaJsonRpcClient(chain);

    const engine = JRPCEngineV2.create({
      middleware: [solanaMiddleware, networkMiddleware],
    });

    const provider = providerFromEngineV2(engine);
    this.updateProviderEngineProxy(provider);
    await this.lookupNetwork(injectedProvider, chainId);
  }

  protected async lookupNetwork(_injectedProvider: P, chainId: string): Promise<string> {
    this.update({
      chainId,
    });
    return chainId || "";
  }

  protected abstract getProviderHandlers(injectedProvider: P): ISolanaProviderHandlers;
}
