import { providerErrors } from "@metamask/rpc-errors";
import { JRPCEngine, providerAsMiddleware, providerFromEngine } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

import { createAaMiddleware } from "../rpc/ethRpcMiddlewares";

export interface AccountAbstractionProviderConfig extends BaseProviderConfig {
  chainConfig: CustomChainConfig;
}
export interface AccountAbstractionProviderState extends BaseProviderState {
  privateKey?: string;
}
export class AccountAbstractionProvider extends BaseProvider<AccountAbstractionProviderConfig, AccountAbstractionProviderState, string> {
  privateKeyProvider: EthereumPrivateKeyProvider;

  constructor({ config, state }: { config: AccountAbstractionProviderConfig; state?: AccountAbstractionProviderState }) {
    super({ config, state });
  }

  public static getProviderInstance = async (params: { privKey: string; chainConfig: CustomChainConfig }): Promise<AccountAbstractionProvider> => {
    const providerFactory = new AccountAbstractionProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.privKey);
    return providerFactory;
  };

  public async setupProvider(privKey: string): Promise<void> {
    const engine = new JRPCEngine();
    const ethereumPrivateKeyProvider = await EthereumPrivateKeyProvider.getProviderInstance({
      privKey,
      chainConfig: this.config.chainConfig,
    });
    const { provider: ethProvider } = ethereumPrivateKeyProvider;
    const aaMiddleware = createAaMiddleware({ ethProvider, chainConfig: this.config.chainConfig });
    engine.push(aaMiddleware);
    engine.push(providerAsMiddleware(ethProvider));
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }

  public async updateAccount(_params: { privateKey: string }): Promise<void> {
    throw providerErrors.unsupportedMethod("updateAccount");
  }

  public async switchChain(_params: { chainId: string }): Promise<void> {
    throw providerErrors.unsupportedMethod("switchChain");
  }

  protected async lookupNetwork(): Promise<string> {
    throw providerErrors.unsupportedMethod("lookupNetwork");
  }
}
