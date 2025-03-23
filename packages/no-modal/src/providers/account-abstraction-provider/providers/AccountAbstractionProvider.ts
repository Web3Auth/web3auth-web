import {
  type AccountAbstractionMultiChainConfig,
  type BiconomySmartAccountConfig,
  type BundlerConfig,
  type ISmartAccount,
  type KernelSmartAccountConfig,
  type NexusSmartAccountConfig,
  type PaymasterConfig,
  type SafeSmartAccountConfig,
  SMART_ACCOUNT,
  type TrustSmartAccountConfig,
} from "@toruslabs/ethereum-controllers";
import { JRPCEngine, providerErrors, providerFromEngine } from "@web3auth/auth";
import { type Client, createPublicClient, defineChain, EIP1193Provider, http } from "viem";
import { type BundlerClient, createBundlerClient, createPaymasterClient, type PaymasterClient, type SmartAccount } from "viem/account-abstraction";

import { CHAIN_NAMESPACES, type CustomChainConfig, type IProvider, WalletInitializationError } from "@/core/base";

import { BaseProvider, type BaseProviderConfig, type BaseProviderState } from "../../base-provider";
import { createAaMiddleware, eoaProviderAsMiddleware } from "../rpc/ethRpcMiddlewares";
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
    params: AccountAbstractionProviderConfig & { eoaProvider: IProvider }
  ): Promise<AccountAbstractionProvider> => {
    const providerInstance = new AccountAbstractionProvider({ config: params });
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
    const bundlerAndPaymasterConfig = this.config.smartAccountChainsConfig[currentChain.chainId];
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
    this._smartAccount = await this.config.smartAccountInit.getSmartAccount({
      owner: eoaProvider as EIP1193Provider,
      client: this._publicClient,
    });

    // setup bundler and paymaster
    if (paymasterConfig) {
      this._paymasterClient = createPaymasterClient({
        ...paymasterConfig,
        transport: paymasterConfig.transport ?? http(paymasterConfig.url),
      });
    }
    this._bundlerClient = createBundlerClient({
      ...bundlerConfig,
      account: this.smartAccount,
      client: this._publicClient,
      transport: bundlerConfig.transport ?? http(bundlerConfig.url),
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
    const eoaMiddleware = eoaProviderAsMiddleware(eoaProvider);
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
}: {
  accountAbstractionConfig: AccountAbstractionMultiChainConfig;
  chain: CustomChainConfig;
  chains: CustomChainConfig[];
  provider: IProvider;
}) => {
  let smartAccountInit: ISmartAccount;
  // TODO: check if smartAccountConfig is per chain or global, if is per chain, need to move smartAccountInit to setupProvider
  const { smartAccountType, chains: smartAccountChainsConfig } = accountAbstractionConfig;
  const { smartAccountConfig } = smartAccountChainsConfig[chain.chainId] || {};
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
    default:
      throw new Error("Smart account type not supported");
  }
  return AccountAbstractionProvider.getProviderInstance({
    eoaProvider: provider,
    smartAccountInit,
    chain,
    chains,
    smartAccountChainsConfig,
  });
};

export { type AccountAbstractionMultiChainConfig, type BundlerConfig, type PaymasterConfig, SMART_ACCOUNT };
