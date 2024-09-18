import { createFetchMiddleware } from "@toruslabs/base-controllers";
import { JRPCEngine, providerErrors, providerFromEngine } from "@web3auth/auth";
import { CustomChainConfig, IProvider } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import { Client, createPublicClient, defineChain, http } from "viem";
import { BundlerClient, createBundlerClient, createPaymasterClient, PaymasterClient, SmartAccount } from "viem/account-abstraction";

import { createAaMiddleware } from "../rpc/ethRpcMiddlewares";
import { ISmartAccount } from "./smartAccounts";
import { BundlerConfig, PaymasterConfig } from "./types";
import { getProviderHandlers } from "./utils";

export interface AccountAbstractionProviderConfig extends BaseProviderConfig {
  smartAccountInit: ISmartAccount;
  bundlerConfig: BundlerConfig;
  paymasterConfig?: PaymasterConfig;
}
export interface AccountAbstractionProviderState extends BaseProviderState {}

export class AccountAbstractionProvider extends BaseProvider<AccountAbstractionProviderConfig, AccountAbstractionProviderState, IProvider> {
  private _smartAccount: SmartAccount | null;

  private _bundlerClient: BundlerClient | null;

  private _paymasterClient: PaymasterClient | null;

  constructor({ config, state }: { config: AccountAbstractionProviderConfig; state?: AccountAbstractionProviderState }) {
    super({ config, state });
  }

  get smartAccount(): SmartAccount | null {
    return this._smartAccount;
  }

  get bundlerClient(): BundlerClient | null {
    return this._bundlerClient;
  }

  get paymasterClient(): PaymasterClient | null {
    return this._paymasterClient;
  }

  public static getProviderInstance = async (params: {
    eoaProvider: IProvider;
    smartAccountInit: ISmartAccount;
    chainConfig: CustomChainConfig;
    bundlerConfig: BundlerConfig;
    paymasterConfig?: PaymasterConfig;
  }): Promise<AccountAbstractionProvider> => {
    const providerFactory = new AccountAbstractionProvider({ config: params });
    await providerFactory.setupProvider(params.eoaProvider);
    return providerFactory;
  };

  public async setupProvider(eoaProvider: IProvider): Promise<void> {
    // setup public client for viem smart account
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
    this._smartAccount = await this.config.smartAccountInit.getSmartAccount({
      owner: eoaProvider,
      client: client as Client,
    });

    // setup bundler and paymaster
    if (this.config.paymasterConfig) {
      this._paymasterClient = createPaymasterClient({
        transport: http(this.config.paymasterConfig.url),
        ...this.config.paymasterConfig,
      });
    }
    this._bundlerClient = createBundlerClient({
      account: this.smartAccount,
      client: client as Client,
      transport: http(this.config.bundlerConfig.url),
      paymaster: this._paymasterClient,
      ...this.config.bundlerConfig,
    });

    const providerHandlers = getProviderHandlers({
      bundlerClient: this._bundlerClient,
      smartAccount: this._smartAccount,
    });

    // setup rpc engine and AA middleware
    const engine = new JRPCEngine();
    const aaMiddleware = await createAaMiddleware({
      eoaProvider,
      handlers: providerHandlers,
    });
    const fetchMiddleware = createFetchMiddleware({ rpcTarget: this.config.chainConfig.rpcTarget });
    engine.push(aaMiddleware);
    engine.push(fetchMiddleware);
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
