import { Transaction } from "@solana/web3.js";
import { createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { RequestArguments, SafeEventEmitterProvider, WalletInitializationError } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { createSolanaMiddleware, IProviderHandlers } from "../../solanaRpcMiddlewares";
import { createInjectedProviderProxyMiddleware } from "./injectedProviderProxy";
import { InjectedProvider } from "./interface";

export class TorusInjectedProvider extends BaseProvider<BaseProviderConfig, BaseProviderState, InjectedProvider> {
  public _providerProxy!: SafeEventEmitterProvider;

  constructor({ config, state }: { config?: BaseProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
    if (!this.config.chainConfig.chainId) throw WalletInitializationError.invalidProviderConfigError("Please provide chainId in chain config");
  }

  public async setupProvider(injectedProvider: InjectedProvider): Promise<SafeEventEmitterProvider> {
    await this.lookupNetwork(injectedProvider);
    const providerHandlers: IProviderHandlers = {
      requestAccounts: async () => {
        const accounts = (await injectedProvider.request({
          method: "solana_requestAccounts",
          params: {},
        })) as string[];
        return accounts;
      },

      getAccounts: async () => {
        const accounts = (await injectedProvider.request({
          method: "solana_accounts",
          params: {},
        })) as string[];
        return accounts;
      },

      getPrivateKey: async () => {
        throw ethErrors.rpc.methodNotSupported();
      },

      signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
        const message = await injectedProvider.request<Uint8Array>({
          method: "signMessage",
          params: {
            message: req.params?.message,
          },
        });
        return message;
      },

      signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
        if (!req.params?.message) {
          throw ethErrors.rpc.invalidParams("message");
        }
        const message = bs58.decode(req.params.message).toString("hex");
        const response = (await injectedProvider.request({
          method: "sign_transaction",
          params: { message },
        })) as string;

        const buf = Buffer.from(response, "hex");
        const sendTx = Transaction.from(buf);
        return sendTx;
      },

      signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
        if (!req.params?.message) {
          throw ethErrors.rpc.invalidParams("message");
        }
        const message = bs58.decode(req.params.message).toString("hex");
        const response = await injectedProvider.request<string>({
          method: "send_transaction",
          params: { message },
        });
        return { signature: response };
      },

      signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
        if (!req.params?.message || !req.params?.message.length) {
          throw ethErrors.rpc.invalidParams("message");
        }
        const signedTransactions: Transaction[] = [];
        for (const transaction of req.params.message) {
          const message = bs58.decode(transaction).toString("hex");
          const response = await injectedProvider.request<string>({
            method: "sign_transaction",
            params: { message },
          });
          const buf = Buffer.from(response, "hex");
          const sendTx = Transaction.from(buf);

          signedTransactions.push(sendTx);
        }
        return signedTransactions;
      },

      getProviderState: async (req, res, _, end) => {
        const [accounts, chainId] = await Promise.all([
          injectedProvider.request<string[]>({
            method: "solana_requestAccounts",
            params: {},
          }),
          injectedProvider.request<string>({
            method: "solana_chainId",
            params: {},
          }),
        ]);
        res.result = {
          accounts,
          chainId,
          isUnlocked: !!accounts?.length,
        };
        end();
      },
    };
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const injectedProviderProxy = createInjectedProviderProxyMiddleware(injectedProvider);
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

  protected async lookupNetwork(provider: InjectedProvider): Promise<string> {
    const chainId = await provider.request<string>({
      method: "solana_chainId",
      params: {},
    });
    if (chainId !== this.config.chainConfig.chainId) {
      throw WalletInitializationError.invalidNetwork(`Wrong network. Expected ${this.config.chainConfig.chainId} but got ${chainId}`);
    }
    return chainId;
  }
}
