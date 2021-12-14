import type { Keypair, Transaction } from "@solana/web3.js";
import { BaseConfig, BaseController, BaseState, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import {
  CustomChainConfig,
  InvalidProviderConfigError,
  PROVIDER_EVENTS,
  ProviderNotReadyError,
  RequestArguments,
  RpcConnectionFailedError,
  SafeEventEmitterProvider,
} from "@web3auth/base";

import { createJsonRpcClient } from "../JrpcClient";
import { createSolanaMiddleware, IProviderHandlers } from "../solanaRpcMiddlewares";
import { sendRpcRequest } from "../utils";

interface SolanaProviderState extends BaseState {
  _initialized: boolean;
  _errored: boolean;
  error: Error;
}

interface SolanaProviderConfig extends BaseConfig {
  chainConfig: CustomChainConfig;
}
export class PrivKeySolanaProvider extends BaseController<SolanaProviderConfig, SolanaProviderState> {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  private transactionGenerator: (serializedTx: string) => Transaction;

  private keyPairGenerator: (privKey: string) => Keypair;

  constructor({ config, state }: { config: SolanaProviderConfig & Pick<SolanaProviderConfig, "chainConfig">; state?: SolanaProviderState }) {
    if (!config.chainConfig) throw new InvalidProviderConfigError("Please provide chainconfig");
    super({ config, state });
    this.defaultState = {
      _initialized: false,
      _errored: false,
      error: null,
    };
    this.chainConfig = config.chainConfig;
    this.init();
  }

  public async init(): Promise<void> {
    const { Transaction: SolTx, Keypair: SolKeyPair, Message } = await import("@solana/web3.js");
    this.transactionGenerator = (serializedTx: string) => {
      const data = Buffer.from(serializedTx, "hex");
      const tx = SolTx.populate(Message.from(data));
      return tx;
    };
    this.keyPairGenerator = (privKey: string) => {
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
        // eslint-disable-next-line no-console
        console.log("error", error);
        this.update({
          _errored: true,
          error,
        });
        this.emit(PROVIDER_EVENTS.ERRORED, { error });
      });
  }

  public setupProvider(privKey: string): SafeEventEmitterProvider {
    if (!this.state._initialized) throw new ProviderNotReadyError("Provider not initialized");
    const keyPair = this.keyPairGenerator(privKey);

    const providerHandlers: IProviderHandlers = {
      version: "1", // TODO: get this from the provider
      requestAccounts: async () => {
        return [keyPair.publicKey.toBase58()];
      },
      getAccounts: async () => [keyPair.publicKey.toBase58()],
      signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
        const transaction = this.transactionGenerator(req.params?.message);
        transaction.partialSign(keyPair);
        return transaction;
      },
      signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
        const transaction = this.transactionGenerator(req.params?.message);
        transaction.partialSign(keyPair);
        const fetchOnlyProvider = this.getFetchOnlyProvider();
        await sendRpcRequest<string[], string>(fetchOnlyProvider, "sendTransaction", [transaction.serialize().toString("hex")]);
        return { signature: Buffer.from(transaction.serialize()).toString("hex") };
      },
      signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
        const signedTransactions: Transaction[] = [];
        for (const tx of req.params?.message || []) {
          const transaction = this.transactionGenerator(tx);
          transaction.partialSign(keyPair);
          signedTransactions.push(transaction);
        }
        return signedTransactions;
      },
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
    const { networkMiddleware } = createJsonRpcClient(this.chainConfig);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    return provider;
  }

  private async lookupNetwork(): Promise<void> {
    const fetchOnlyProvider = this.getFetchOnlyProvider();
    const res = await sendRpcRequest<[], string>(fetchOnlyProvider, "getHealth", []);
    if (res !== "ok")
      throw new RpcConnectionFailedError(
        `Failed to lookup network for following rpc target: ${this.chainConfig.rpcTarget}, lookup status is: ${res}`
      );
  }
}
