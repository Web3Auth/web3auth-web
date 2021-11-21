/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSwappableProxy, providerFromEngine, SafeEventEmitterProvider } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, PROVIDER_EVENTS } from "@web3auth/base";
import type web3 from "web3";
import type { TransactionConfig } from "web3-core";

import { createEthMiddleware, IProviderHandlers } from "./ethRpcMiddlewares";
import { createJsonRpcClient } from "./JrpcClient";
import { sendRpcRequest } from "./utils";
export class EthereumProvider extends SafeEventEmitter {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  private _initialized: boolean;

  private web3Connection: () => web3;

  constructor(chainConfig: CustomChainConfig) {
    super();
    this.chainConfig = chainConfig;
  }

  public async init(): Promise<void> {
    const { default: Web3 } = await import("web3");
    this.web3Connection = () => {
      return new Web3(new Web3.providers.HttpProvider(this.chainConfig.rpcTarget));
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
    const providerHandlers: IProviderHandlers = {
      version: "1", // TODO: get this from the provider
      getAccounts: async () => [],
      processTransaction: async (tx: TransactionConfig): Promise<string> => {
        const web3Instance = this.web3Connection();
        const signedTx = await web3Instance.eth.signTransaction(tx, privKey);
        const txReceipt = await web3Instance.eth.sendSignedTransaction(signedTx.raw);
        return txReceipt.transactionHash;
      },
    };
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.chainConfig);
    engine.push(ethMiddleware);
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
    const chainConfig = { ...this.chainConfig };
    const network = await sendRpcRequest<[], string>(fetchOnlyProvider, "net_version", []);
    if (chainConfig.chainId !== network) throw new Error(`Invalid network, net_version is: ${network}`);
  }
}
