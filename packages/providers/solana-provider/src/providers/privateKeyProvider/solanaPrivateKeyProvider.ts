import type { Keypair, Transaction } from "@solana/web3.js";
import { BaseConfig, BaseState, createFetchMiddleware, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import nacl from "@toruslabs/tweetnacl-js";
import { CustomChainConfig, PROVIDER_EVENTS, RequestArguments, SafeEventEmitterProvider, WalletInitializationError } from "@web3auth/base";
import { BaseProvider } from "@web3auth/base-provider";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { createJsonRpcClient } from "../../JrpcClient";
import { createSolanaMiddleware, IProviderHandlers } from "../../solanaRpcMiddlewares";
import { createRandomId } from "../../utils";

interface SolanaProviderState extends BaseState {
  _initialized: boolean;
  _errored: boolean;
  error: Error | null;
}

interface SolanaProviderConfig extends BaseConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}
export class SolanaPrivateKeyProvider extends BaseProvider<string> {
  public _providerProxy!: SafeEventEmitterProvider;

  readonly chainConfig: Omit<CustomChainConfig, "chainNamespace">;

  private transactionGenerator!: (serializedTx: string) => Transaction;

  private keyPairGenerator!: (privKey: string) => Keypair;

  constructor({ config, state }: { config: SolanaProviderConfig & Pick<SolanaProviderConfig, "chainConfig">; state?: SolanaProviderState }) {
    if (!config.chainConfig) throw WalletInitializationError.invalidProviderConfigError("Please provide chainconfig");
    super({ config, state });
    this.chainConfig = config.chainConfig;
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<SafeEventEmitterProvider> => {
    const providerFactory = new SolanaPrivateKeyProvider({ config: { chainConfig: params.chainConfig } });
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
    super.init();
  }

  public setupProvider(privKey: string): SafeEventEmitterProvider {
    if (typeof privKey !== "string") throw WalletInitializationError.invalidParams("privKey must be a string");
    if (!this.state._initialized) throw WalletInitializationError.providerNotReadyError("Provider not initialized");
    const keyPair = this.keyPairGenerator(privKey);

    const providerHandlers: IProviderHandlers = {
      requestAccounts: async () => {
        return [keyPair.publicKey.toBase58()];
      },
      getAccounts: async () => [keyPair.publicKey.toBase58()],
      signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
        if (!req.params?.message) {
          throw ethErrors.rpc.invalidParams("message");
        }
        const transaction = this.transactionGenerator(req.params?.message as string);
        transaction.partialSign(keyPair);
        return transaction;
      },
      signMessage: async (req: JRPCRequest<{ message: Uint8Array }>): Promise<Uint8Array> => {
        if (!req.params?.message) {
          throw ethErrors.rpc.invalidParams("message");
        }
        const signedMsg = nacl.sign.detached(req.params.message, keyPair.secretKey);
        return signedMsg;
      },
      signAndSendTransaction: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
        if (!req.params?.message) {
          throw ethErrors.rpc.invalidParams("message");
        }
        const transaction = this.transactionGenerator(req.params?.message as string);
        transaction.partialSign(keyPair);

        const fetchOnlyProvider = this.getFetchOnlyProvider();
        const sig = await fetchOnlyProvider.sendAsync<string[], string>({
          jsonrpc: "2.0",
          id: createRandomId(),
          method: "sendTransaction",
          params: [bs58.encode(transaction.serialize())],
        });
        return { signature: sig };
      },
      signAllTransactions: async (req: JRPCRequest<{ message: string[] }>): Promise<Transaction[]> => {
        if (!req.params?.message || !req.params?.message.length) {
          throw ethErrors.rpc.invalidParams("message");
        }
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

  protected async lookupNetwork(): Promise<void> {
    const fetchOnlyProvider = this.getFetchOnlyProvider();
    const genesisHash = await fetchOnlyProvider.sendAsync<string[], string>({
      jsonrpc: "2.0",
      id: createRandomId(),
      method: "getGenesisHash",
      params: [],
    });
    if (!genesisHash)
      throw WalletInitializationError.rpcConnectionError(`Failed to lookup network for following rpc target: ${this.chainConfig.rpcTarget}`);
    if (this.chainConfig.chainId !== genesisHash.substring(0, 32))
      throw WalletInitializationError.invalidProviderConfigError(
        `Provided rpcTarget ${this.chainConfig.rpcTarget} does not belongs to configured chainId ${this.chainConfig.chainId}`
      );
  }

  private getFetchOnlyProvider(): SafeEventEmitterProvider {
    const engine = new JRPCEngine();
    const networkMiddleware = createFetchMiddleware({ rpcTarget: this.chainConfig.rpcTarget });
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    return provider;
  }
}
