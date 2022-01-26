import { Keypair, Message, Transaction } from "@solana/web3.js";
import { providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCMiddleware, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import nacl from "@toruslabs/tweetnacl-js";
import { CHAIN_NAMESPACES, CustomChainConfig, RequestArguments, SafeEventEmitterProvider, WalletInitializationError } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState, createRandomId } from "@web3auth/base-provider";
import bs58 from "bs58";
import { ethErrors } from "eth-rpc-errors";

import { createJsonRpcClient } from "../../rpc/JrpcClient";
import {
  AddSolanaChainParameter,
  createAccountMiddleware,
  createChainSwitchMiddleware,
  createSolanaMiddleware,
  IAccountHandlers,
  IChainSwitchHandlers,
  IProviderHandlers,
} from "../../rpc/solanaRpcMiddlewares";

export interface SolanaPrivKeyProviderConfig extends BaseProviderConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}
export interface SolanaPrivKeyProviderState extends BaseProviderState {
  privateKey?: string;
}
export class SolanaPrivateKeyProvider extends BaseProvider<BaseProviderConfig, SolanaPrivKeyProviderState, string> {
  constructor({ config, state }: { config: SolanaPrivKeyProviderConfig; state?: BaseProviderState }) {
    super({ config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.SOLANA } }, state });
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<SafeEventEmitterProvider> => {
    const providerFactory = new SolanaPrivateKeyProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.privKey);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.state.privateKey)
      throw ethErrors.provider.custom({ message: "Private key is not found in state, plz pass it in constructor state param", code: -32603 });
    await this.setupProvider(this.state.privateKey);
    return this._providerEngineProxy.sendAsync({ jsonrpc: "2.0", id: createRandomId(), method: "eth_accounts" });
  }

  public async setupProvider(privKey: string): Promise<void> {
    const transactionGenerator = (serializedTx: string): Transaction => {
      const decodedTx = bs58.decode(serializedTx);
      const tx = Transaction.populate(Message.from(decodedTx));
      return tx;
    };
    const keyPairGenerator = (): Keypair => {
      return Keypair.fromSecretKey(Buffer.from(privKey, "hex"));
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
        if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: -32603 });

        const transaction = transactionGenerator(req.params?.message as string);
        transaction.sign(keyPair);

        const sig = await this._providerEngineProxy.sendAsync<string[], string>({
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
    const { networkMiddleware } = createJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    engine.push(this.getChainSwitchMiddleware());
    engine.push(this.getAccountMiddleware());
    engine.push(solanaMiddleware);
    engine.push(networkMiddleware);

    const provider = providerFromEngine(engine);
    const providerWithRequest = {
      ...provider,
      request: async (args: RequestArguments) => {
        return provider.sendAsync(args);
      },
    } as SafeEventEmitterProvider;

    this.updateProviderEngineProxy(providerWithRequest);

    await this.lookupNetwork();
  }

  public async updateAccount(params: { privateKey: string }): Promise<void> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: -32603 });
    const existingKey = await this._providerEngineProxy.sendAsync<[], string>({ jsonrpc: "2.0", id: createRandomId(), method: "solanaPrivateKey" });
    if (existingKey !== params.privateKey) {
      await this.setupProvider(params.privateKey);
      this._providerEngineProxy.emit("accountsChanged", {
        accounts: await this._providerEngineProxy.sendAsync<[], string[]>({ jsonrpc: "2.0", id: createRandomId(), method: "requestAccounts" }),
      });
    }
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: -32603 });
    const chainConfig = this.getChainConfig(params.chainId);
    this.update({
      chainId: "loading",
    });
    this.configure({ chainConfig });
    const privKey = await this._providerEngineProxy.sendAsync<[], string>({ jsonrpc: "2.0", id: createRandomId(), method: "" });
    await this.setupProvider(privKey);
  }

  protected async lookupNetwork(): Promise<string> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: -32603 });
    const health = await this._providerEngineProxy.sendAsync<string[], string>({
      jsonrpc: "2.0",
      id: createRandomId(),
      method: "getHealth",
      params: [],
    });
    const { chainConfig } = this.config;
    if (health !== "ok")
      throw WalletInitializationError.rpcConnectionError(`Failed to lookup network for following rpc target: ${chainConfig.rpcTarget}`);

    if (this.state.chainId !== chainConfig.chainId) {
      this.emit("chainChanged", chainConfig.chainId);
      this.emit("connect", { chainId: this.config.chainConfig.chainId });
    }
    this.update({ chainId: chainConfig.chainId });
    return chainConfig.chainId;
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IChainSwitchHandlers = {
      addNewChainConfig: async (req: JRPCRequest<AddSolanaChainParameter>): Promise<void> => {
        if (!req.params) throw ethErrors.rpc.invalidParams("Missing request params");
        const { chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency } = req.params;

        if (!chainId) throw ethErrors.rpc.invalidParams("Missing chainId in chainParams");
        if (!rpcUrls || rpcUrls.length === 0) throw ethErrors.rpc.invalidParams("Missing rpcUrls in chainParams");
        if (!nativeCurrency) throw ethErrors.rpc.invalidParams("Missing nativeCurrency in chainParams");
        this.addChain({
          chainNamespace: CHAIN_NAMESPACES.SOLANA,
          chainId,
          ticker: nativeCurrency?.symbol || "SOL",
          tickerName: nativeCurrency?.name || "Solana",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorer: blockExplorerUrls?.[0] || "",
        });
      },
      switchSolanaChain: async (req: JRPCRequest<{ chainId: string }>): Promise<void> => {
        if (!req.params) throw ethErrors.rpc.invalidParams("Missing request params");
        if (!req.params.chainId) throw ethErrors.rpc.invalidParams("Missing chainId");
        await this.switchChain(req.params);
      },
    };
    const chainSwitchMiddleware = createChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }

  private getAccountMiddleware(): JRPCMiddleware<unknown, unknown> {
    const accountHandlers: IAccountHandlers = {
      updatePrivatekey: async (req: JRPCRequest<{ privateKey: string }>): Promise<void> => {
        if (!req.params) throw ethErrors.rpc.invalidParams("Missing request params");
        if (!req.params.privateKey) throw ethErrors.rpc.invalidParams("Missing privateKey");
        const { privateKey } = req.params;
        await this.updateAccount({ privateKey });
      },
    };
    return createAccountMiddleware(accountHandlers);
  }
}
