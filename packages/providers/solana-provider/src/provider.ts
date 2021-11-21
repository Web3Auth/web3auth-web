/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Connection, Keypair, Transaction, TransactionCtorFields } from "@solana/web3.js";
import { createSwappableProxy, providerFromEngine, SafeEventEmitterProvider } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, PROVIDER_EVENTS } from "@web3auth/base";

import { createJsonRpcClient } from "./JrpcClient";
import { createSolanaMiddleware, IProviderHandlers } from "./solanaRpcMiddlewares";
import { sendRpcRequest } from "./utils";
export class SolanaProvider extends SafeEventEmitter {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  private _initialized: boolean;

  private transactionGenerator: (serializedTx: string) => Transaction;

  private keyPairGenerator: (privKey: string) => Keypair;

  constructor(chainConfig: CustomChainConfig) {
    super();
    this.chainConfig = chainConfig;
  }

  public async init(): Promise<void> {
    const { Transaction: SolTx, Connection: SolConnection, Keypair: SolKeyPair, Message } = await import("@solana/web3.js");
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
        this._initialized = true;
        this.emit(PROVIDER_EVENTS.INITIALIZED);
        return true;
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log("error", error);
        this.emit(PROVIDER_EVENTS.ERRORED, { error });
      });
  }

  public setupProvider(privKey: string): SafeEventEmitterProvider {
    if (!this._initialized) throw new Error("Provider not initialized");
    const keyPair = this.keyPairGenerator(privKey);

    const providerHandlers: IProviderHandlers = {
      version: "1", // TODO: get this from the provider
      requestAccounts: async () => {
        return [keyPair.publicKey.toBase58()];
      },
      getAccounts: async () => [keyPair.publicKey.toBase58()],
      signTransaction: async (req: JRPCRequest<{ serializedTransaction: string }>): Promise<string> => {
        const transaction = this.transactionGenerator(req.params?.serializedTransaction);
        transaction.partialSign(keyPair);
        const serializedSignedTx = transaction.serialize({ requireAllSignatures: false }).toString("hex");
        return serializedSignedTx;
      },
      signAllTransactions: async (req: JRPCRequest<{ serializedTransactions: string[] }>): Promise<string[]> => {
        const serializedSignedTransactions = [];
        for (const tx of req.params?.serializedTransactions || []) {
          const transaction = this.transactionGenerator(tx);
          transaction.partialSign(keyPair);
          const serializedSignedTx = transaction.serialize({ requireAllSignatures: false }).toString("hex");
          serializedSignedTransactions.push(serializedSignedTx);
        }
        return serializedSignedTransactions;
      },

      getProviderState: (req, res, _, end) => {
        res.result = {
          accounts: [keyPair.publicKey.toBase58()],
          chainId: this.chainConfig.chainId,
          isUnlocked: this._initialized,
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
    this._providerProxy = createSwappableProxy<SafeEventEmitterProvider>(provider);
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
    if (res !== "ok") throw new Error(`Failed to lookup network for following rpc target: ${this.chainConfig.rpcTarget}, lookup status is: ${res}`);
  }
}
