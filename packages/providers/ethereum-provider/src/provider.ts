import Common, { Hardfork } from "@ethereumjs/common";
import { TransactionFactory } from "@ethereumjs/tx";
import {
  decrypt,
  EthEncryptedData,
  getEncryptionPublicKey,
  MessageTypes,
  personalSign,
  signTypedData,
  SignTypedDataVersion,
  TypedDataV1,
  TypedMessage,
} from "@metamask/eth-sig-util";
import { BaseConfig, createFetchMiddleware, createSwappableProxy, providerFromEngine, signMessage } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  PROVIDER_EVENTS,
  RequestArguments,
  SafeEventEmitterProvider,
  WalletInitializationError,
} from "@web3auth/base";
import { BaseProvider, BaseProviderState } from "@web3auth/base-provider";
import { privateToAddress, stripHexPrefix } from "ethereumjs-util";
import log from "loglevel";

import { createEthMiddleware, IProviderHandlers } from "./ethRpcMiddlewares";
import { createJsonRpcClient } from "./jrpcClient";
import { createRandomId } from "./utils";
import { MessageParams, TransactionParams, TypedMessageParams } from "./walletMidddleware";

interface EthereumProviderConfig extends BaseConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}

// TODO: Add support for changing chainId
export class EthereumPrivateKeyProvider extends BaseProvider<string> {
  // Assigned in setupProvider
  public _providerProxy!: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  // Assigned in fetch only provider
  private rpcProvider!: SafeEventEmitterProvider; // for direct communication with chain (without intercepted methods)

  constructor({ config, state }: { config: EthereumProviderConfig; state?: BaseProviderState }) {
    if (!config.chainConfig) throw WalletInitializationError.invalidProviderConfigError("Please provide chainConfig");
    super({ config, state });
    this.defaultState = {
      _initialized: false,
      _errored: false,
      error: null,
      chainId: "loading",
    };
    this.chainConfig = {
      ...config.chainConfig,
      chainNamespace: CHAIN_NAMESPACES.EIP155,
    };
    this.init();
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<SafeEventEmitterProvider> => {
    const providerFactory = new EthereumPrivateKeyProvider({ config: { chainConfig: params.chainConfig } });
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
    this.lookupNetwork()
      .then((chainId) => {
        this.update({
          _initialized: true,
          _errored: false,
          error: null,
          chainId,
        });
        this.emit(PROVIDER_EVENTS.INITIALIZED);
        return true;
      })
      .catch((error) => {
        log.error("error while looking up network", error);
        this.update({
          _errored: true,
          error,
        });
        this.emit(PROVIDER_EVENTS.ERRORED, { error });
      });
  }

  public setupProvider(privKey: string): SafeEventEmitterProvider {
    if (!this.state._initialized) throw WalletInitializationError.notReady("Provider not initialized");
    const providerHandlers: IProviderHandlers = {
      getAccounts: async (_: JRPCRequest<unknown>) => [`0x${privateToAddress(Buffer.from(privKey, "hex")).toString("hex")}`],
      processTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
        const rpcProvider = this.getFetchOnlyProvider();
        const common = await this.getCommonConfiguration(!!txParams.maxFeePerGas && !!txParams.maxPriorityFeePerGas);
        const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
        const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();
        const txHash = await rpcProvider.sendAsync<string[], string>({
          method: "eth_sendRawTransaction",
          params: [`0x${signedTx.toString("hex")}`],
          id: createRandomId(),
          jsonrpc: "2.0",
        });
        return txHash;
      },
      processSignTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
        const common = await this.getCommonConfiguration(!!txParams.maxFeePerGas && !!txParams.maxPriorityFeePerGas);
        const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
        const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();
        return `0x${signedTx.toString("hex")}`;
      },
      processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
        const rawMessageSig = signMessage(privKey, msgParams.data);
        return rawMessageSig;
      },
      processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
        const privKeyBuffer = Buffer.from(privKey, "hex");
        const sig = personalSign({ privateKey: privKeyBuffer, data: msgParams.data });
        return sig;
      },
      processTypedMessage: async (msgParams: MessageParams<TypedDataV1>, _: JRPCRequest<unknown>): Promise<string> => {
        log.debug("processTypedMessage", msgParams);
        const privKeyBuffer = Buffer.from(privKey, "hex");
        const sig = signTypedData({ privateKey: privKeyBuffer, data: msgParams.data, version: SignTypedDataVersion.V1 });
        return sig;
      },
      processTypedMessageV3: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
        log.debug("processTypedMessageV3", msgParams);
        const privKeyBuffer = Buffer.from(privKey, "hex");
        const sig = signTypedData({ privateKey: privKeyBuffer, data: msgParams.data, version: SignTypedDataVersion.V3 });
        return sig;
      },
      processTypedMessageV4: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
        log.debug("processTypedMessageV4", msgParams);
        const privKeyBuffer = Buffer.from(privKey, "hex");
        const sig = signTypedData({ privateKey: privKeyBuffer, data: msgParams.data, version: SignTypedDataVersion.V4 });
        return sig;
      },
      processEncryptionPublicKey: async (address: string, _: JRPCRequest<unknown>): Promise<string> => {
        log.info("processEncryptionPublicKey", address);
        return getEncryptionPublicKey(privKey);
      },
      processDecryptMessage: (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): string => {
        log.info("processDecryptMessage", msgParams);
        const stripped = stripHexPrefix(msgParams.data);
        const buff = Buffer.from(stripped, "hex");
        const decrypted = decrypt({ encryptedData: JSON.parse(buff.toString("utf8")) as EthEncryptedData, privateKey: privKey });
        return decrypted;
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

  protected async lookupNetwork(): Promise<string> {
    const fetchOnlyProvider = this.getFetchOnlyProvider();
    const chainConfig = { ...this.chainConfig };
    const network = await fetchOnlyProvider.sendAsync<[], string>({ jsonrpc: "2.0", id: createRandomId(), method: "net_version", params: [] });

    if (parseInt(chainConfig.chainId, 16) !== parseInt(network, 10))
      throw WalletInitializationError.rpcConnectionError(`Invalid network, net_version is: ${network}`);
    return network;
  }

  private getFetchOnlyProvider(): SafeEventEmitterProvider {
    if (this.rpcProvider) return this.rpcProvider;
    const engine = new JRPCEngine();
    const fetchMiddleware = createFetchMiddleware({ rpcTarget: this.chainConfig.rpcTarget });
    engine.push(fetchMiddleware);
    const provider = providerFromEngine(engine);
    this.rpcProvider = createSwappableProxy<SafeEventEmitterProvider>(provider);
    return provider;
  }

  private async getCommonConfiguration(supportsEIP1559: boolean) {
    const { displayName: name } = this.chainConfig;
    const hardfork = supportsEIP1559 ? Hardfork.London : Hardfork.Berlin;
    const { chainId } = this.state;

    const customChainParams = {
      name,
      chainId: chainId === "loading" ? 0 : parseInt(chainId, 16),
      networkId: chainId === "loading" ? 0 : Number.parseInt(chainId, 10),
      hardfork,
    };

    return Common.custom(customChainParams);
  }
}
