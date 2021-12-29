import type { Keypair, Transaction } from "@solana/web3.js";
import { BaseConfig, BaseController, BaseState, createFetchMiddleware, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, PROVIDER_EVENTS, RequestArguments, SafeEventEmitterProvider, WalletInitializationError } from "@web3auth/base";
import bs58 from "bs58";

import { createJsonRpcClient } from "../JrpcClient";
import { createSolanaMiddleware, IProviderHandlers } from "../solanaRpcMiddlewares";
import { sendRpcRequest } from "../utils";
interface SolanaProviderState extends BaseState {
  _initialized: boolean;
  _errored: boolean;
  error: Error;
}

interface SolanaProviderConfig extends BaseConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}
export class SolanaPrivKeyProvider extends BaseController<SolanaProviderConfig, SolanaProviderState> {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: Omit<CustomChainConfig, "chainNamespace">;

  private transactionGenerator: (serializedTx: string) => Transaction;

  private keyPairGenerator: (privKey: string) => Keypair;

  constructor({ config, state }: { config: SolanaProviderConfig & Pick<SolanaProviderConfig, "chainConfig">; state?: SolanaProviderState }) {
    if (!config.chainConfig) throw WalletInitializationError.invalidProviderConfigError("Please provide chainconfig");
    super({ config, state });
    this.defaultState = {
      _initialized: false,
      _errored: false,
      error: null,
    };
    this.chainConfig = config.chainConfig;
    this.init();
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<SafeEventEmitterProvider> => {
    const providerFactory = new SolanaPrivKeyProvider({ config: { chainConfig: params.chainConfig } });
    return new Promise((resolve, reject) => {
      // wait for provider to get ready
      providerFactory.once(PROVIDER_EVENTS.INITIALIZED, async () => {
        const provider = providerFactory.setupProvider(params.privKey);
        resolve(provider);
      });
      providerFactory.on(PROVIDER_EVENTS.ERRORED, (error) => {
        reject(error);
      });
      providerFactory.init();
    });
  };

  public async init(): Promise<void> {
    const { Transaction: SolTx, Keypair: SolKeyPair, Message } = await import("@solana/web3.js");
    this.transactionGenerator = (serializedTx: string): Transaction => {
      const decodedTx = bs58.decode(serializedTx);
      const tx = SolTx.populate(Message.from(decodedTx));
      return tx;
    };
    this.keyPairGenerator = (privKey: string): Keypair => {
      return SolKeyPair.fromSecretKey(Buffer.from(privKey, "hex"));
    };
    this.lookupNetwork()
      .then(() => {
        this.update({
          _initialized: true,
          _errored: false,
          error: null,
        });
        this.emit(PROVIDER_EVENTS.INITIALIZED);
        return true;
      })
      .catch((error) => {
        this.update({
          _errored: true,
          error,
        });
        this.emit(PROVIDER_EVENTS.ERRORED, { error });
      });
  }

  public setupProvider(privKey: string): SafeEventEmitterProvider {
    if (!this.state._initialized) throw WalletInitializationError.providerNotReadyError("Provider not initialized");
    const keyPair = this.keyPairGenerator(privKey);

    const providerHandlers: IProviderHandlers = {
      requestAccounts: async () => {
        return [keyPair.publicKey.toBase58()];
      },
      getAccounts: async () => [keyPair.publicKey.toBase58()],
      // signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
      //   const transaction = this.transactionGenerator(req.params?.message);
      //   transaction.partialSign(keyPair);
      //   return transaction;
      // },
      signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
        const transaction = this.transactionGenerator(req.params?.message);
        transaction.partialSign(keyPair);

        const fetchOnlyProvider = this.getFetchOnlyProvider();
        const sig = await sendRpcRequest<string[], string>(fetchOnlyProvider, "sendTransaction", [bs58.encode(transaction.serialize())]);
        return { signature: sig };
      },
      // signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
      //   const signedTransactions: Transaction[] = [];
      //   for (const tx of req.params?.message || []) {
      //     const transaction = this.transactionGenerator(tx);
      //     transaction.partialSign(keyPair);
      //     signedTransactions.push(transaction);
      //   }
      //   return signedTransactions;
      // },
      getProviderState: (req, res, _, end) => {
        res.result = {
          accounts: [keyPair.publicKey.toBase58()],
          chainId: this.chainConfig.chainId,
          isUnlocked: this.state._initialized,
        };
        end();
      },
    };
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.chainConfig);
    engine.push(solanaMiddleware);
    engine.push(networkMiddleware);
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

  private getFetchOnlyProvider(): SafeEventEmitterProvider {
    const engine = new JRPCEngine();
    const networkMiddleware = createFetchMiddleware({ rpcTarget: this.chainConfig.rpcTarget });
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    return provider;
  }

  private async lookupNetwork(): Promise<void> {
    const fetchOnlyProvider = this.getFetchOnlyProvider();
    const res = await sendRpcRequest<[], string>(fetchOnlyProvider, "getHealth", []);
    if (res !== "ok")
      throw WalletInitializationError.rpcConnectionError(
        `Failed to lookup network for following rpc target: ${this.chainConfig.rpcTarget}, lookup status is: ${res}`
      );
  }
}
