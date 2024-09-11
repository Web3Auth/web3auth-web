import { JRPCEngine, providerErrors, providerFromEngine } from "@web3auth/auth";
import { CustomChainConfig, IProvider } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Client, createPublicClient, defineChain, http } from "viem";
import { createBundlerClient, createPaymasterClient, PaymasterClient } from "viem/account-abstraction";

import { createAaMiddleware } from "../rpc/ethRpcMiddlewares";
import { ISmartAccount } from "./smartAccounts";
import { BundlerConfig, PaymasterConfig } from "./types";
import { getProviderHandlers } from "./utils";

export interface AccountAbstractionProviderConfig extends BaseProviderConfig {
  smartAccount: ISmartAccount;
  bundlerConfig: BundlerConfig;
  paymasterConfig?: PaymasterConfig;
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
    const smartAccount = await this.config.smartAccount.getSmartAccount({
      owner: eoaProvider,
      client: client as Client,
    });

    // setup bundler and paymaster
    let paymasterClient: PaymasterClient | undefined;
    if (this.config.paymasterConfig) {
      paymasterClient = createPaymasterClient({
        transport: http(this.config.paymasterConfig.url),
        ...this.config.paymasterConfig,
      });
    }
    const bundlerClient = createBundlerClient({
      account: smartAccount,
      client: client as Client,
      transport: http(this.config.bundlerConfig.url),
      paymaster: paymasterClient,
      ...this.config.bundlerConfig,
    });

    const providerHandlers = getProviderHandlers({
      bundlerClient,
      smartAccount,
    });

    // setup rpc engine and AA middleware
    const engine = new JRPCEngine();
    const aaMiddleware = await createAaMiddleware({
      eoaProvider,
      handlers: providerHandlers,
    });
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
