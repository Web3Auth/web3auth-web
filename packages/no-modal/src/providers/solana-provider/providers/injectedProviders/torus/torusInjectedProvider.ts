import { JRPCEngine, providerErrors, providerFromEngine } from "@web3auth/auth";

import { isHexStrict, WalletInitializationError } from "@/core/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@/core/base-provider";

import { ITorusWalletProvider } from "../../../interface";
import { createSolanaMiddleware } from "../../../rpc/solanaRpcMiddlewares";
import { createInjectedProviderProxyMiddleware } from "../injectedProviderProxy";
import { getTorusHandlers } from "./providerHandlers";

export class TorusInjectedProvider extends BaseProvider<BaseProviderConfig, BaseProviderState, ITorusWalletProvider> {
  readonly PROVIDER_CHAIN_NAMESPACE = "solana";

  constructor({ config, state }: { config: BaseProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    // overrides the base provider implementation
    await this.provider.request({
      method: "switchSolanaChain",
      params: [{ chainId: params.chainId }],
    });
  }

  public async setupProvider(injectedProvider: ITorusWalletProvider, chainId: string): Promise<void> {
    this.handleInjectedProviderUpdate(injectedProvider);
    const chain = this.config.getChain(chainId);
    const { chainNamespace } = chain;
    if (chainNamespace !== this.PROVIDER_CHAIN_NAMESPACE) throw WalletInitializationError.incompatibleChainNameSpace("Invalid chain namespace");
    await this.setupEngine(injectedProvider, chainId);

    this.emit("connect", { chainId });
    this.emit("chainChanged", chainId);
  }

  protected async lookupNetwork(_injectedProvider: ITorusWalletProvider, chainId: string): Promise<string> {
    if (!this.provider) throw providerErrors.custom({ message: "Torus solana provider is not initialized", code: 4902 });

    const connectedChainId = await this.provider.request<never, string>({
      method: "solana_chainId",
    });

    const connectedHexChainId = isHexStrict(connectedChainId.toString()) ? connectedChainId : `0x${parseInt(connectedChainId, 10).toString(16)}`;
    if (chainId !== connectedHexChainId)
      throw WalletInitializationError.rpcConnectionError(`Invalid network, net_version is: ${connectedHexChainId}, expected: ${chainId}`);

    return chainId;
  }

  private async setupEngine(injectedProvider: ITorusWalletProvider, chainId: string): Promise<void> {
    const providerHandlers = getTorusHandlers(injectedProvider);
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const injectedProviderProxy = createInjectedProviderProxyMiddleware(injectedProvider);
    const engine = new JRPCEngine();
    engine.push(solanaMiddleware);
    engine.push(injectedProviderProxy);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    await this.lookupNetwork(injectedProvider, chainId);
  }

  private async handleInjectedProviderUpdate(injectedProvider: ITorusWalletProvider): Promise<void> {
    injectedProvider.on("accountsChanged", async (accounts: string[]) => {
      this.emit("accountsChanged", accounts);
    });
    injectedProvider.on("chainChanged", async (chainId: string) => {
      const connectedHexChainId = isHexStrict(chainId) ? chainId : `0x${parseInt(chainId, 10).toString(16)}`;
      // Check if chainId changed and trigger event
      await this.setupProvider(injectedProvider, connectedHexChainId);
    });
  }
}
