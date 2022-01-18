import { MessageTypes, TypedDataV1, TypedMessage } from "@metamask/eth-sig-util";
import { BaseConfig, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCMiddleware, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import type { IConnector, ITxData } from "@walletconnect/types";
import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  RequestArguments,
  SafeEventEmitterProvider,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { BaseProvider, BaseProviderState } from "@web3auth/base-provider";
import { ethErrors } from "eth-rpc-errors";
import log from "loglevel";

import { createEthMiddleware, IProviderHandlers } from "../../rpc/ethRpcMiddlewares";
import { createJsonRpcClient } from "../../rpc/jrpcClient";
import { createRandomId } from "../../rpc/utils";
import { MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/walletMidddleware";

export interface WalletConnectProviderConfig extends BaseConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}

// TODO: Add support for changing chainId
export class WalletConnectProvider extends BaseProvider<WalletConnectProviderConfig, BaseProviderState, IConnector> {
  // Assigned in setupProvider
  public _providerProxy: SafeEventEmitterProvider | null = null;

  readonly chainConfig: CustomChainConfig;

  private accounts: string[];

  private chainId: number;

  constructor({ config, state }: { config: WalletConnectProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
    this.chainConfig = {
      ...config.chainConfig,
      chainNamespace: CHAIN_NAMESPACES.EIP155,
    };
  }

  public static getProviderInstance = async (params: {
    connector: IConnector;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<SafeEventEmitterProvider> => {
    const providerFactory = new WalletConnectProvider({ config: { chainConfig: params.chainConfig } });
    const provider = await providerFactory.setupProvider(params.connector);
    return provider;
  };

  public async setupProvider(connector: IConnector): Promise<SafeEventEmitterProvider> {
    this.onConnectorStateUpdate(connector);
    return this.setupEngine(connector);
  }

  protected async lookupNetwork(connector: IConnector): Promise<string> {
    if (!connector.connected) throw WalletLoginError.notConnectedError("Wallet connect connector is not connected");
    if (parseInt(this.chainConfig.chainId, 16) !== parseInt(connector.chainId.toString(), 10))
      throw WalletInitializationError.rpcConnectionError(
        `Invalid network, net_version is: ${connector.chainId}, expected: ${parseInt(this.chainConfig.chainId, 16)}`
      );
    return this.chainConfig.chainId;
  }

  private async setupEngine(connector: IConnector): Promise<SafeEventEmitterProvider> {
    const ethMiddleware = await this.getEthMiddleWare(connector);
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

  private async getEthMiddleWare(connector: IConnector): Promise<JRPCMiddleware<unknown, unknown>> {
    await this.lookupNetwork(connector);
    this.accounts = connector.accounts || [];
    this.chainId = connector.chainId;
    const providerHandlers: IProviderHandlers = {
      getPrivateKey: async () => {
        throw ethErrors.rpc.methodNotSupported();
      },
      getAccounts: async (_: JRPCRequest<unknown>) => {
        const { accounts } = connector;
        if (accounts && accounts.length) {
          return accounts;
        }
        throw new Error("Failed to get accounts");
      },
      processTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
        const result = await connector.sendTransaction(txParams as ITxData);
        return result;
      },
      processSignTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
        const result = await connector.signTransaction(txParams as ITxData);
        return result;
      },
      processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
        const result = await connector.signMessage([msgParams.from, msgParams.data]);
        return result;
      },
      processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
        const result = await connector.signPersonalMessage([msgParams.data, msgParams.from]);
        return result;
      },
      processTypedMessage: async (msgParams: MessageParams<TypedDataV1>, _: JRPCRequest<unknown>): Promise<string> => {
        log.debug("processTypedMessage", msgParams);
        const result = await connector.signTypedData([msgParams.from, msgParams.data]);
        return result;
      },
      processTypedMessageV3: async (_: TypedMessageParams<TypedMessage<MessageTypes>>): Promise<string> => {
        throw ethErrors.rpc.methodNotSupported();
      },
      processTypedMessageV4: async (_: TypedMessageParams<TypedMessage<MessageTypes>>): Promise<string> => {
        throw ethErrors.rpc.methodNotSupported();
      },
      processEncryptionPublicKey: async (_: string): Promise<string> => {
        throw ethErrors.rpc.methodNotSupported();
      },
      processDecryptMessage: (_: MessageParams<string>): string => {
        throw ethErrors.rpc.methodNotSupported();
      },
    };
    return createEthMiddleware(providerHandlers);
  }

  private async onConnectorStateUpdate(connector: IConnector) {
    connector.on("session_update", async (error: Error, payload) => {
      if (error) {
        this.emit("error", error);
        return;
      }
      const { accounts, chainId, rpcUrl } = payload;
      // Check if accounts changed and trigger event
      if (!this.accounts || (accounts && this.accounts !== accounts)) {
        this.accounts = accounts;
        await this.setupEngine(connector);
        this.emit("accountsChanged", accounts);
      }
      // Check if chainId changed and trigger event
      if (!this.chainId || (chainId && this.chainId !== chainId)) {
        this.chainId = chainId;
        // Handle rpcUrl update
        this.configure({
          chainConfig: { ...this.config.chainConfig, chainId: `0x${this.chainId.toString(16)}`, rpcTarget: rpcUrl },
        });
        await this.setupEngine(connector);
        this.emit("chainChanged", chainId);
      }
    });
  }
}
