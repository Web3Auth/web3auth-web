import { BaseConfig, BaseController, BaseState, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, PROVIDER_EVENTS, ProviderNotReadyError, RequestArguments, SafeEventEmitterProvider } from "@web3auth/base";
import bs58 from "bs58";

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
      requestAccounts: async () => {
        const accounts = (await injectedProvider.provider.request({
          method: "solana_requestAccounts",
          params: {},
        })) as string[];
        return accounts;
      },
      getAccounts: async () => {
        const accounts = (await injectedProvider.provider.request({
          method: "solana_accounts",
          params: {},
        })) as string[];
        return accounts;
      },
      // signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
      //   const message = bs58.decode(req.params.message).toString("hex");
      //   const response = (await injectedProvider.provider.request({
      //     method: "sign_transaction",
      //     params: { message },
      //   })) as string;

      //   const buf = Buffer.from(response, "hex");
      //   const sendTx = Transaction.from(buf);
      //   return sendTx;
      // },
      signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
        const message = bs58.decode(req.params.message).toString("hex");
        const response = (await injectedProvider.provider.request({
          method: "send_transaction",
          params: { message },
        })) as string;
        return { signature: response };
      },
      // signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
      //   const signedTransactions: Transaction[] = [];
      //   for (const transaction of req.params.message) {
      //     const message = bs58.decode(transaction).toString("hex");
      //     const response = (await injectedProvider.provider.request({
      //       method: "sign_transaction",
      //       params: { message },
      //     })) as string;
      //     const buf = Buffer.from(response, "hex");
      //     const sendTx = Transaction.from(buf);

      //     signedTransactions.push(sendTx);
      //   }
      //   return signedTransactions;
      // },
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
