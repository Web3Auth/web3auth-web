import { providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine } from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";

import { IPhantomWalletProvider } from "../../../interface";
import { createSolanaMiddleware } from "../../../rpc/solanaRpcMiddlewares";
import { createInjectedProviderProxyMiddleware } from "../injectedProviderProxy";
import { getPhantomHandlers } from "./providerHandlers";

export class PhantomInjectedProvider extends BaseProvider<BaseProviderConfig, BaseProviderState, IPhantomWalletProvider> {
  constructor({ config, state }: { config: BaseProviderConfig; state?: BaseProviderState }) {
    super({ config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.SOLANA } }, state });
  }

  public async switchChain(_: { chainId: string }): Promise<void> {
    return Promise.resolve();
  }

  public async setupProvider(injectedProvider: IPhantomWalletProvider): Promise<void> {
    const providerHandlers = getPhantomHandlers(injectedProvider);
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const injectedProviderProxy = createInjectedProviderProxyMiddleware(injectedProvider);
    const engine = new JRPCEngine();
    engine.push(solanaMiddleware);
    engine.push(injectedProviderProxy);
    const provider = providerFromEngine(engine);

    this.updateProviderEngineProxy(provider);
    await this.lookupNetwork(injectedProvider);
  }

  protected async lookupNetwork(_: IPhantomWalletProvider): Promise<string> {
    const { chainConfig } = this.config;
    this.update({
      chainId: chainConfig.chainId,
    });
    return chainConfig.chainId || "";
    // const genesisHash = await phantomProvider.request<string>({
    //   method: "getGenesisHash",
    //   params: [],
    // });
    // const { chainConfig } = this.config;
    // if (!genesisHash) throw WalletInitializationError.rpcConnectionError(`Failed to connect with phantom wallet`);
    // if (chainConfig.chainId !== genesisHash.substring(0, 32))
    //   throw WalletInitializationError.invalidNetwork(
    //     `Wallet is connected to wrong network,Please change your network to ${
    //       SOLANA_NETWORKS[chainConfig.chainId] || chainConfig.displayName
    //     } from phantom wallet extention.`
    //   );
    // return genesisHash.substring(0, 32);
  }
}
