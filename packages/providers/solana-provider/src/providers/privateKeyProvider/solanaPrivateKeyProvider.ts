import type { Keypair, Transaction } from "@solana/web3.js";
import { BaseConfig, createFetchMiddleware, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import nacl from "@toruslabs/tweetnacl-js";
import { CustomChainConfig, RequestArguments, SafeEventEmitterProvider, WalletInitializationError } from "@web3auth/base";
import { BaseProvider, BaseProviderState } from "@web3auth/base-provider";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { createJsonRpcClient } from "../../rpc/JrpcClient";
import { createSolanaMiddleware, IProviderHandlers } from "../../rpc/solanaRpcMiddlewares";
import { createRandomId } from "../../rpc/utils";

export interface SolanaPrivKeyProviderConfig extends BaseConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}
export class SolanaPrivateKeyProvider extends BaseProvider<SolanaPrivKeyProviderConfig, BaseProviderState, string> {
  public _providerProxy!: SafeEventEmitterProvider;

  constructor({ config, state }: { config: SolanaPrivKeyProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
    if (!config.chainConfig.chainId) throw WalletInitializationError.invalidProviderConfigError("Please provide chainId in chainConfig");
    if (!config.chainConfig.rpcTarget) throw WalletInitializationError.invalidProviderConfigError("Please provide rpcTarget in chainConfig");
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<SafeEventEmitterProvider> => {
    const providerFactory = new SolanaPrivateKeyProvider({ config: { chainConfig: params.chainConfig } });
    return providerFactory.setupProvider(params.privKey);
  };

  public async setupProvider(privKey: string): Promise<SafeEventEmitterProvider> {
    await this.lookupNetwork();
    const { Transaction: SolTx, Keypair: SolKeyPair, Message } = await import("@solana/web3.js");
    const transactionGenerator = (serializedTx: string): Transaction => {
      const decodedTx = bs58.decode(serializedTx);
      const tx = SolTx.populate(Message.from(decodedTx));
      return tx;
    };
    const keyPairGenerator = (): Keypair => {
      return SolKeyPair.fromSecretKey(Buffer.from(privKey, "hex"));
    };
    if (typeof privKey !== "string") throw WalletInitializationError.invalidParams("privKey must be a string");
    const keyPair = keyPairGenerator();

    const providerHandlers: IProviderHandlers = {
      requestAccounts: async () => {
        return [keyPair.publicKey.toBase58()];
      },
      getAccounts: async () => [keyPair.publicKey.toBase58()],
      getPrivateKey: async () => privKey,
      signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<Transaction> => {
        if (!req.params?.message) {
          throw ethErrors.rpc.invalidParams("message");
        }
        const transaction = transactionGenerator(req.params?.message as string);
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
        const transaction = transactionGenerator(req.params?.message as string);
        transaction.sign(keyPair);

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
          const transaction = transactionGenerator(tx);
          transaction.partialSign(keyPair);
          signedTransactions.push(transaction);
        }
        return signedTransactions;
      },
    };
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.config.chainConfig);
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

  protected async lookupNetwork(): Promise<string> {
    const fetchOnlyProvider = this.getFetchOnlyProvider();
    const health = await fetchOnlyProvider.sendAsync<string[], string>({
      jsonrpc: "2.0",
      id: createRandomId(),
      method: "getHealth",
      params: [],
    });
    const { chainConfig } = this.config;
    if (health !== "ok")
      throw WalletInitializationError.rpcConnectionError(`Failed to lookup network for following rpc target: ${chainConfig.rpcTarget}`);
    return chainConfig.chainId;
  }

  private getFetchOnlyProvider(): SafeEventEmitterProvider {
    const engine = new JRPCEngine();
    const networkMiddleware = createFetchMiddleware({ rpcTarget: this.config.chainConfig.rpcTarget });
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    return provider;
  }
}
