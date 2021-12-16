/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Common from "@ethereumjs/common";
import { TransactionFactory } from "@ethereumjs/tx";
import { BaseConfig, BaseController, BaseState, createSwappableProxy, providerFromEngine, signMessage } from "@toruslabs/base-controllers";
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
import {
  getEncryptionPublicKey,
  personalSign,
  signTypedData,
  signTypedData_v4 as signTypedDataV4,
  signTypedDataLegacy,
  TypedData,
} from "eth-sig-util";
import { privateToAddress } from "ethereumjs-util";

import { createRandomId } from ".";
import { createEthMiddleware, IProviderHandlers } from "./ethRpcMiddlewares";
import { createJsonRpcClient } from "./JrpcClient";
import { sendRpcRequest } from "./utils";
import { MessageParams, TransactionParams } from "./walletMidddleware";
export const HARDFORKS = {
  BERLIN: "berlin",
  LONDON: "london",
};

const signTypeData = async (privKey: Buffer, typedData: TypedData, version = "V1") => {
  switch (version) {
    case "V1":
      return signTypedDataLegacy(privKey, { data: typedData });
    case "V4":
      return signTypedDataV4(privKey, { data: typedData });
    case "V3":
      return signTypedData(privKey, { data: typedData });
    default:
      return signTypedDataLegacy(privKey, { data: typedData });
  }
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
    if (!config.chainConfig) throw new InvalidProviderConfigError("Please provide chainconfig");
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
    const providerHandlers: IProviderHandlers = {
      version: "1", // TODO: get this from the provider
      getAccounts: async (req: JRPCRequest<unknown>) => [`0x${privateToAddress(Buffer.from(privKey, "hex")).toString("hex")}`],
      processTransaction: async (txParams: TransactionParams, req: JRPCRequest<unknown>): Promise<string> => {
        console.log("processTransaction", txParams);
        const rpcProvider = this.getFetchOnlyProvider();
        const common = await this.getCommonConfiguration(!!txParams.maxFeePerGas && !!txParams.maxPriorityFeePerGas);
        const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });

        console.log("unsignedEthTx", unsignedEthTx);
        const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();

        console.log("signedTx", signedTx);
        const txHash = await sendRpcRequest<string[], string>(rpcProvider, "eth_sendRawTransaction", [`0x${signedTx.toString("hex")}`]);
        return txHash;
      },
      processSignTransaction: async (txParams: TransactionParams, req: JRPCRequest<unknown>): Promise<string> => {
        const common = await this.getCommonConfiguration(!!txParams.maxFeePerGas && !!txParams.maxPriorityFeePerGas);
        const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
        const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();
        return `0x${signedTx.toString("hex")}`;
      },
      processEthSignMessage: async (msgParams: MessageParams, req: JRPCRequest<unknown>): Promise<string> => {
        const rawMessageSig = signMessage(privKey, msgParams.data);
        return rawMessageSig;
      },
      processPersonalMessage: async (msgParams: MessageParams, req: JRPCRequest<unknown>): Promise<string> => {
        const privKeyBuffer = Buffer.from(privKey, "hex");
        const sig = personalSign(privKeyBuffer, { data: msgParams.data });
        return sig;
      },
      processTypedMessage: async (msgParams: MessageParams, req: JRPCRequest<unknown>): Promise<string> => {
        const privKeyBuffer = Buffer.from(privKey, "hex");
        const sig = await signTypeData(privKeyBuffer, msgParams.data, "V1");
        return sig;
      },
      processTypedMessageV3: async (msgParams: MessageParams, req: JRPCRequest<unknown>): Promise<string> => {
        const privKeyBuffer = Buffer.from(privKey, "hex");
        const sig = await signTypeData(privKeyBuffer, msgParams.data, "V3");
        return sig;
      },
      processTypedMessageV4: async (msgParams: MessageParams, req: JRPCRequest<unknown>): Promise<string> => {
        const privKeyBuffer = Buffer.from(privKey, "hex");
        const sig = await signTypeData(privKeyBuffer, msgParams.data, "V4");
        return sig;
      },
      processEncryptionPublicKey: async (address: string, req: JRPCRequest<unknown>): Promise<string> => {
        return getEncryptionPublicKey(privKey);
      },
    };
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.chainConfig);
    engine.push(ethMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    const providerWithRequest = {
      ...provider,
      request: async (args: RequestArguments) => {
        return provider.sendAsync({ jsonrpc: "2.0", id: createRandomId(), ...args });
      },
    } as SafeEventEmitterProvider;
    this._providerProxy = createSwappableProxy<SafeEventEmitterProvider>(providerWithRequest);
    return this._providerProxy;
  }

  private getFetchOnlyProvider(): SafeEventEmitterProvider {
    console.log("getFetchOnlyProvider", this.rpcProvider);
    if (this.rpcProvider) return this.rpcProvider;
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.chainConfig);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.rpcProvider = createSwappableProxy<SafeEventEmitterProvider>(provider);
    console.log("getFetchOnlyProvider 2", this.rpcProvider);
    return provider;
  }

  private async lookupNetwork(): Promise<string> {
    const fetchOnlyProvider = this.getFetchOnlyProvider();
    const chainConfig = { ...this.chainConfig };
    const network = await sendRpcRequest<[], string>(fetchOnlyProvider, "net_version", []);

    if (parseInt(chainConfig.chainId, 16) !== parseInt(network)) throw new RpcConnectionFailedError(`Invalid network, net_version is: ${network}`);
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
