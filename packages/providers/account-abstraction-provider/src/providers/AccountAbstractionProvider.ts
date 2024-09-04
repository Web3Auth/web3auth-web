import { providerErrors } from "@metamask/rpc-errors";
import { JRPCEngine, providerFromEngine } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, IProvider } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { createPublicClient, defineChain, http, PublicClient } from "viem";

import { createAaMiddleware } from "../rpc/ethRpcMiddlewares";
import { ISmartAccount } from "./smartAccounts";

export interface AccountAbstractionProviderConfig extends BaseProviderConfig {
  chainConfig: CustomChainConfig;
  smartAccount: ISmartAccount;
}
export interface AccountAbstractionProviderState extends BaseProviderState {}

export class AccountAbstractionProvider extends BaseProvider<AccountAbstractionProviderConfig, AccountAbstractionProviderState, IProvider> {
  privateKeyProvider: EthereumPrivateKeyProvider;

  constructor({ config, state }: { config: AccountAbstractionProviderConfig; state?: AccountAbstractionProviderState }) {
    super({ config, state });
  }

  public static getProviderInstance = async (params: {
    eoaProvider: IProvider;
    smartAccount: ISmartAccount;
    chainConfig: CustomChainConfig;
  }): Promise<AccountAbstractionProvider> => {
    const providerFactory = new AccountAbstractionProvider({ config: params });
    await providerFactory.setupProvider(params.eoaProvider);
    return providerFactory;
  };

  public async setupProvider(eoaProvider: IProvider): Promise<void> {
    const client = createPublicClient({
      chain: defineChain({
        id: Number.parseInt(this.config.chainConfig.chainId, 16), // id in number form
        name: this.config.chainConfig.displayName,
        rpcUrls: {
          default: {
            http: [this.config.chainConfig.rpcTarget],
            webSocket: [this.config.chainConfig.wsTarget],
          },
        },
        blockExplorers: this.config.chainConfig.blockExplorerUrl
          ? {
              default: {
                name: "explorer", // TODO: correct name if chain config has it
                url: this.config.chainConfig.blockExplorerUrl,
              },
            }
          : undefined,
        nativeCurrency: {
          name: this.config.chainConfig.tickerName,
          symbol: this.config.chainConfig.ticker,
          decimals: this.config.chainConfig.decimals || 18,
        },
      }),
      transport: http(),
    });
    const smartAccount = await this.config.smartAccount.getSmartAccount({
      owner: eoaProvider,
      client: client as PublicClient,
    });

    const engine = new JRPCEngine();
    const aaMiddleware = await createAaMiddleware({ ethProvider: eoaProvider, chainConfig: this.config.chainConfig, smartAccount });
    engine.push(aaMiddleware);
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
