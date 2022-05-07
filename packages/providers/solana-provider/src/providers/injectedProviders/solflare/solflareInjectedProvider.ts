import type Solflare from "@solflare-wallet/sdk";
import { providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine } from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";

import { createConfigMiddleware } from "../../../rpc/JrpcClient";
import { createSolanaMiddleware } from "../../../rpc/solanaRpcMiddlewares";
import { getSolflareHandlers } from "./providerHandlers";

export class SolflareInjectedProvider extends BaseProvider<BaseProviderConfig, BaseProviderState, Solflare> {
  constructor({ config, state }: { config: BaseProviderConfig; state?: BaseProviderState }) {
    super({ config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.SOLANA } }, state });
  }

  public async switchChain(_: { chainId: string }): Promise<void> {
    return Promise.resolve();
  }

  public async setupProvider(injectedProvider: Solflare): Promise<void> {
    const providerHandlers = getSolflareHandlers(injectedProvider, this.getProviderEngineProxy.bind(this));
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const configMiddleware = createConfigMiddleware(this.config.chainConfig as CustomChainConfig);

    const engine = new JRPCEngine();
    engine.push(solanaMiddleware);
    engine.push(configMiddleware);

    const provider = providerFromEngine(engine);

    this.updateProviderEngineProxy(provider);
    await this.lookupNetwork(injectedProvider);
  }

  protected async lookupNetwork(_: Solflare): Promise<string> {
    const { chainConfig } = this.config;
    this.update({
      chainId: chainConfig.chainId,
    });
    return chainConfig.chainId || "";
  }
}
