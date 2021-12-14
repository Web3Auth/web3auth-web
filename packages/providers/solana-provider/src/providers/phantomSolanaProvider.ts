import type { Transaction } from "@solana/web3.js";
import { BaseConfig, BaseController, BaseState, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, PROVIDER_EVENTS, ProviderNotReadyError, RequestArguments, SafeEventEmitterProvider } from "@web3auth/base";

import { createInjectedProviderProxyMiddleware, InjectedProviderOptions } from "../injectedProviderProxy";
import { createSolanaMiddleware, IProviderHandlers } from "../solanaRpcMiddlewares";
interface SolanaInjectedProviderState extends BaseState {
  _initialized: boolean;
  _errored: boolean;
  error: Error;
}

type SolanaInjectedProviderConfig = BaseConfig;
export class SolanaInjectedProviderProxy extends BaseController<SolanaInjectedProviderConfig, SolanaInjectedProviderState> {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  constructor({ config, state }: { config?: SolanaInjectedProviderConfig; state?: SolanaInjectedProviderState }) {
    super({ config, state });
    this.defaultState = {
      _initialized: false,
      _errored: false,
      error: null,
    };
    this.init();
  }

  public async init(): Promise<void> {
    this.update({
      _initialized: true,
      _errored: false,
      error: null,
    });
    this.emit(PROVIDER_EVENTS.INITIALIZED);
  }

  public setupProviderFromInjectedProvider(injectedProvider: InjectedProviderOptions): SafeEventEmitterProvider {
    if (!this.state._initialized) throw new ProviderNotReadyError("Provider not initialized");
    const providerHandlers: IProviderHandlers = {
      version: "1", // TODO: get this from the provider
      requestAccounts: async () => {
        return [""];
      },
      getAccounts: async () => [""],
      signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
        const transaction = (await injectedProvider.provider.request({
          method: "signTransaction",
          params: {
            message: req.params?.message,
          },
        })) as Transaction;
        return transaction;
      },
      signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
        const message = (await injectedProvider.provider.request({
          method: "signMessage",
          params: {
            message: req.params?.message,
          },
        })) as Uint8Array;
        return message;
      },
      signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
        const { signature } = (await injectedProvider.provider.request({
          method: "signAndSendTransaction",
          params: {
            message: req.params?.message,
          },
        })) as { signature: string };
        return { signature };
      },
      signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
        const transaction = (await injectedProvider.provider.request({
          method: "signAllTransactions",
          params: {
            message: req.params?.message,
          },
        })) as Transaction[];
        return transaction;
      },
      getProviderState: (req, res, _, end) => {
        res.result = {
          accounts: [""],
          chainId: this.chainConfig.chainId,
          isUnlocked: this.state._initialized,
        };
        end();
      },
    };
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const injectedProviderProxy = createInjectedProviderProxyMiddleware({ provider: injectedProvider.provider });
    const engine = new JRPCEngine();
    engine.push(solanaMiddleware);
    engine.push(injectedProviderProxy);
    const provider = providerFromEngine(engine);

    const providerWithRequest = {
      ...provider,
      request: async (args: RequestArguments) => {
        return provider.sendAsync(args);
      },
    } as SafeEventEmitterProvider;
    this._providerProxy = createSwappableProxy<SafeEventEmitterProvider>(providerWithRequest);
    return this._providerProxy;
  }
}
