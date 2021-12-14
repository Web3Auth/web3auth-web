import { Transaction } from "@solana/web3.js";
import { BaseConfig, BaseController, BaseState, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, PROVIDER_EVENTS, ProviderNotReadyError, RequestArguments, SafeEventEmitterProvider } from "@web3auth/base";

import { createInjectedProviderProxyMiddleware, InjectedProviderOptions } from "../injectedProviderProxy";
import { createSolanaMiddleware, IProviderHandlers } from "../solanaRpcMiddlewares";
interface TorusInjectedProviderState extends BaseState {
  _initialized: boolean;
  _errored: boolean;
  error: Error;
}

type TorusInjectedProviderConfig = BaseConfig;

export class TorusInjectedProviderProxy extends BaseController<TorusInjectedProviderConfig, TorusInjectedProviderState> {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  constructor({ config, state }: { config?: TorusInjectedProviderConfig; state?: TorusInjectedProviderState }) {
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
      signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
        const response = (await injectedProvider.provider.request({
          method: "sign_message",
          params: {
            data: req.params.message,
          },
        })) as Uint8Array;
        return response;
      },
      signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
        const response = (await injectedProvider.provider.request({
          method: "sign_transaction",
          params: { message: req.params?.message },
        })) as string;

        const buf = Buffer.from(response, "hex");
        const sendTx = Transaction.from(buf);
        return sendTx;
      },
      signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
        const response = (await injectedProvider.provider.request({
          method: "send_transaction",
          params: { message: req.params?.message },
        })) as string;
        return { signature: response };
      },
      signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
        const signedTransactions: Transaction[] = [];
        for (const transaction of req.params.message) {
          const response = (await injectedProvider.provider.request({
            method: "sign_transaction",
            params: { message: transaction },
          })) as string;
          const buf = Buffer.from(response, "hex");
          const sendTx = Transaction.from(buf);

          signedTransactions.push(sendTx);
        }
        return signedTransactions;
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
