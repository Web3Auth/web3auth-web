import {
  type AccountAbstractionMultiChainConfig,
  type BiconomySmartAccountConfig,
  type BundlerConfig,
  type ISmartAccount,
  type KernelSmartAccountConfig,
  type MetamaskSmartAccountConfig,
  METHOD_TYPES,
  type NexusSmartAccountConfig,
  type PaymasterConfig,
  type SafeSmartAccountConfig,
  SMART_ACCOUNT,
  type TrustSmartAccountConfig,
} from "@toruslabs/ethereum-controllers";
import { JRPCEngine, providerErrors, providerFromEngine } from "@web3auth/auth";
import { type Client, createPublicClient, createWalletClient, custom, defineChain, Hex, http } from "viem";
import { type BundlerClient, createBundlerClient, createPaymasterClient, type PaymasterClient, type SmartAccount } from "viem/account-abstraction";

import { CHAIN_NAMESPACES, type CustomChainConfig, type IProvider, WalletInitializationError } from "../../../base";
import { BaseProvider, type BaseProviderConfig, type BaseProviderState } from "../../../providers/base-provider";
import { createAaMiddleware, createEoaMiddleware, providerAsMiddleware } from "../rpc/ethRpcMiddlewares";
import { getProviderHandlers } from "./utils";

interface AccountAbstractionProviderConfig extends BaseProviderConfig {
  smartAccountInit: ISmartAccount;
  smartAccountChainsConfig: AccountAbstractionMultiChainConfig["chains"];
}
interface AccountAbstractionProviderState extends BaseProviderState {
  eoaProvider?: IProvider;
}

class AccountAbstractionProvider extends BaseProvider<AccountAbstractionProviderConfig, AccountAbstractionProviderState, IProvider> {
  readonly PROVIDER_CHAIN_NAMESPACE = CHAIN_NAMESPACES.EIP155;

  private _smartAccount: SmartAccount | null;

  private _publicClient: Client | null;

  private _bundlerClient: BundlerClient | null;

  private _paymasterClient: PaymasterClient | null;

  private _useProviderAsTransport?: boolean;

  constructor({ config, state }: { config: AccountAbstractionProviderConfig; state?: AccountAbstractionProviderState }) {
    super({ config, state });
    this.update({ chainId: config.chain.chainId });
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

  get publicClient(): Client | null {
    return this._publicClient;
  }

  public static getProviderInstance = async (
    params: AccountAbstractionProviderConfig & { eoaProvider: IProvider; useProviderAsTransport?: boolean }
  ): Promise<AccountAbstractionProvider> => {
    const providerInstance = new AccountAbstractionProvider({ config: params });
    providerInstance._useProviderAsTransport = params.useProviderAsTransport;
    await providerInstance.setupProvider(params.eoaProvider);
    providerInstance.update({ eoaProvider: params.eoaProvider });
    return providerInstance;
  };

  public async enable(): Promise<string[]> {
    if (!this.state.eoaProvider) throw providerErrors.custom({ message: "eoaProvider is not found in state, please pass it", code: 4902 });
    await this.setupProvider(this.state.eoaProvider);
    return this._providerEngineProxy.request({ method: "eth_accounts" });
  }

  public async setupProvider(eoaProvider: IProvider): Promise<void> {
    const { currentChain } = this;
    const { chainNamespace } = currentChain;
    if (chainNamespace !== this.PROVIDER_CHAIN_NAMESPACE) throw WalletInitializationError.incompatibleChainNameSpace("Invalid chain namespace");
    const bundlerAndPaymasterConfig = this.config.smartAccountChainsConfig.find((config) => config.chainId === currentChain.chainId);
    if (!bundlerAndPaymasterConfig)
      throw WalletInitializationError.invalidProviderConfigError(`Bundler and paymaster config not found for chain ${currentChain.chainId}`);

    const { bundlerConfig, paymasterConfig } = bundlerAndPaymasterConfig;
    const chain = defineChain({
      id: Number.parseInt(currentChain.chainId, 16), // id in number form
      name: currentChain.displayName,
      rpcUrls: {
        default: {
          http: [currentChain.rpcTarget],
          webSocket: [currentChain.wsTarget],
        },
      },
      blockExplorers: currentChain.blockExplorerUrl
        ? {
            default: {
              name: "explorer", // TODO: correct name if chain config has it
              url: currentChain.blockExplorerUrl,
            },
          }
        : undefined,
      nativeCurrency: {
        name: currentChain.tickerName,
        symbol: currentChain.ticker,
        decimals: currentChain.decimals || 18,
      },
    });
    // setup public client for viem smart account
    this._publicClient = createPublicClient({
      chain,
      transport: http(currentChain.rpcTarget),
    }) as Client;
    const [eoaAddress] = (await eoaProvider.request({ method: METHOD_TYPES.ETH_REQUEST_ACCOUNTS })) as [string];
    const walletClient = createWalletClient({
      account: eoaAddress as Hex,
      chain,
      transport: custom(eoaProvider),
    });
    this._smartAccount = await this.config.smartAccountInit.getSmartAccount({
      walletClient,
      client: this._publicClient,
    });

    // setup bundler and paymaster
    if (paymasterConfig) {
      this._paymasterClient = createPaymasterClient({
        ...paymasterConfig,
        transport: this._useProviderAsTransport ? custom(eoaProvider) : (paymasterConfig.transport ?? http(paymasterConfig.url)),
      });
    }
    this._bundlerClient = createBundlerClient({
      ...bundlerConfig,
      account: this.smartAccount,
      client: this._publicClient,
      transport: this._useProviderAsTransport ? custom(eoaProvider) : (bundlerConfig.transport ?? http(bundlerConfig.url)),
      paymaster: this._paymasterClient,
    });

    const providerHandlers = getProviderHandlers({
      bundlerClient: this._bundlerClient,
      smartAccount: this._smartAccount,
      chain,
      eoaProvider,
    });

    // setup rpc engine and AA middleware
    const engine = new JRPCEngine();
    const aaMiddleware = await createAaMiddleware({
      eoaProvider,
      handlers: providerHandlers,
    });
    engine.push(aaMiddleware);
    const eoaMiddleware = providerAsMiddleware(eoaProvider);
    engine.push(eoaMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    eoaProvider.once("chainChanged", (chainId) => {
      this.update({ chainId });
      this.setupChainSwitchMiddleware();
      this.emit("chainChanged", chainId);
    });
  }

  public async updateAccount(_params: { privateKey: string }): Promise<void> {
    throw providerErrors.unsupportedMethod("updateAccount. Please call it on eoaProvider");
  }

  public async switchChain(_params: { chainId: string }): Promise<void> {
    throw providerErrors.unsupportedMethod("switchChain. Please call it on eoaProvider");
  }

  protected async lookupNetwork(): Promise<string> {
    throw providerErrors.unsupportedMethod("lookupNetwork. Please call it on eoaProvider");
  }

  private async setupChainSwitchMiddleware() {
    return this.setupProvider(this.state.eoaProvider);
  }
}

export const accountAbstractionProvider = async ({
  accountAbstractionConfig,
  chain,
  chains,
  provider,
  useProviderAsTransport,
}: {
  accountAbstractionConfig: AccountAbstractionMultiChainConfig;
  chain: CustomChainConfig;
  chains: CustomChainConfig[];
  provider: IProvider;
  useProviderAsTransport?: boolean;
}): Promise<AccountAbstractionProvider> => {
  let smartAccountInit: ISmartAccount;
  const { smartAccountType, chains: smartAccountChainsConfig } = accountAbstractionConfig;
  const { smartAccountConfig } = smartAccountChainsConfig.find((config) => config.chainId === chain.chainId) || {};
  switch (smartAccountType) {
    case SMART_ACCOUNT.BICONOMY: {
      const { BiconomySmartAccount } = await import("@toruslabs/ethereum-controllers");
      smartAccountInit = new BiconomySmartAccount(smartAccountConfig as BiconomySmartAccountConfig);
      break;
    }
    case SMART_ACCOUNT.KERNEL: {
      const { KernelSmartAccount } = await import("@toruslabs/ethereum-controllers");
      smartAccountInit = new KernelSmartAccount(smartAccountConfig as KernelSmartAccountConfig);
      break;
    }
    case SMART_ACCOUNT.NEXUS: {
      const { NexusSmartAccount } = await import("@toruslabs/ethereum-controllers");
      smartAccountInit = new NexusSmartAccount(smartAccountConfig as NexusSmartAccountConfig);
      break;
    }
    case SMART_ACCOUNT.SAFE: {
      const { SafeSmartAccount } = await import("@toruslabs/ethereum-controllers");
      smartAccountInit = new SafeSmartAccount(smartAccountConfig as SafeSmartAccountConfig);
      break;
    }
    case SMART_ACCOUNT.TRUST: {
      const { TrustSmartAccount } = await import("@toruslabs/ethereum-controllers");
      smartAccountInit = new TrustSmartAccount(smartAccountConfig as TrustSmartAccountConfig);
      break;
    }
    case SMART_ACCOUNT.METAMASK: {
      const { MetamaskSmartAccount } = await import("@toruslabs/ethereum-controllers");
      smartAccountInit = new MetamaskSmartAccount(smartAccountConfig as MetamaskSmartAccountConfig);
      break;
    }
    default:
      throw new Error("Smart account type not supported");
  }
  return AccountAbstractionProvider.getProviderInstance({
    eoaProvider: provider,
    smartAccountInit,
    chain,
    chains,
    smartAccountChainsConfig,
    useProviderAsTransport,
  });
};

export const toEoaProvider = async (aaProvider: IProvider): Promise<IProvider> => {
  // derive EOA provider from AA provider
  const engine = new JRPCEngine();
  const eoaMiddleware = await createEoaMiddleware({ aaProvider });
  engine.push(eoaMiddleware);
  engine.push(providerAsMiddleware(aaProvider));
  return providerFromEngine(engine) as IProvider;
};

export { type AccountAbstractionMultiChainConfig, type AccountAbstractionProvider, type BundlerConfig, type PaymasterConfig, SMART_ACCOUNT };
