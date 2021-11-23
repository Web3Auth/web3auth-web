/* eslint-disable @typescript-eslint/no-unused-vars */
import Common from "@ethereumjs/common";
import { TransactionFactory } from "@ethereumjs/tx";
import {
  BaseConfig,
  BaseController,
  BaseState,
  createSwappableProxy,
  providerFromEngine,
  SafeEventEmitterProvider,
} from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, PROVIDER_EVENTS } from "@web3auth/base";

import { createEthMiddleware, IProviderHandlers } from "./ethRpcMiddlewares";
import { createJsonRpcClient } from "./JrpcClient";
import { sendRpcRequest } from "./utils";
import { TransactionParams } from "./walletMidddleware";

export const HARDFORKS = {
  BERLIN: "berlin",
  LONDON: "london",
};

interface EthereumProviderState extends BaseState {
  _initialized: boolean;
  _errored: boolean;
  error: Error;
  network: string;
}

interface EthereumProviderConfig extends BaseConfig {
  chainConfig: CustomChainConfig;
}
export class EthereumProvider extends BaseController<EthereumProviderConfig, EthereumProviderState> {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  private rpcProvider: SafeEventEmitterProvider; // for direct communication with chain (without intercepted methods)

  constructor({ config, state }: { config: EthereumProviderConfig & Pick<EthereumProviderConfig, "chainConfig">; state?: EthereumProviderState }) {
    if (!config.chainConfig) throw new Error("Please provide chainconfig");
    super({ config, state });
    this.defaultState = {
      _initialized: false,
      _errored: false,
      error: null,
      network: "loading",
    };
    this.chainConfig = config.chainConfig;
    this.init();
  }

  public async init(): Promise<void> {
    this.lookupNetwork()
      .then((network) => {
        this.update({
          _initialized: true,
          _errored: false,
          error: null,
          network,
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
    if (!this.state._initialized) throw new Error("Provider not initialized");
    const providerHandlers: IProviderHandlers = {
      version: "1", // TODO: get this from the provider
      getAccounts: async () => [],
      processTransaction: async (txParams: TransactionParams, req: JRPCRequest<unknown>): Promise<string> => {
        const rpcProvider = this.getFetchOnlyProvider();
        const common = await this.getCommonConfiguration(!!txParams.maxFeePerGas && !!txParams.maxPriorityFeePerGas);
        const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
        const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();
        const txHash = await sendRpcRequest<string[], string>(rpcProvider, "eth_sendRawTransaction", [signedTx.toString("hex")]);
        return txHash;
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
    if (this.rpcProvider) return this.rpcProvider;
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.chainConfig);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.rpcProvider = createSwappableProxy<SafeEventEmitterProvider>(provider);
    return provider;
  }

  private async lookupNetwork(): Promise<string> {
    const fetchOnlyProvider = this.getFetchOnlyProvider();
    const chainConfig = { ...this.chainConfig };
    const network = await sendRpcRequest<[], string>(fetchOnlyProvider, "net_version", []);
    if (parseInt(chainConfig.chainId, 16) !== parseInt(network)) throw new Error(`Invalid network, net_version is: ${network}`);
    return network;
  }

  private async getCommonConfiguration(supportsEIP1559: boolean) {
    const { networkName: name, chainId } = this.chainConfig;
    const hardfork = supportsEIP1559 ? HARDFORKS.LONDON : HARDFORKS.BERLIN;
    const networkId = this.state.network;

    const customChainParams = {
      name,
      chainId: parseInt(chainId, 16),
      networkId: networkId === "loading" ? 0 : Number.parseInt(networkId, 10),
    };

    return Common.forCustomChain("mainnet", customChainParams, hardfork);
  }
}
