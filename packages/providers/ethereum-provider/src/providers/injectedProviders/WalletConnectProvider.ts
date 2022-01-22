import { MessageTypes, TypedDataV1, TypedMessage } from "@metamask/eth-sig-util";
import { createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCMiddleware, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import type { IConnector, ITxData } from "@walletconnect/types";
import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  isHexStrict,
  RequestArguments,
  SafeEventEmitterProvider,
  WalletInitializationError,
  WalletLoginError,
} from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState, createRandomId } from "@web3auth/base-provider";
import { ethErrors } from "eth-rpc-errors";
import log from "loglevel";

import { createEthMiddleware, IProviderHandlers } from "../../rpc/ethRpcMiddlewares";
import { createJsonRpcClient } from "../../rpc/jrpcClient";
import { MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/walletMidddleware";

export interface WalletConnectProviderConfig extends BaseProviderConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}

export interface WalletConnectProviderState extends BaseProviderState {
  accounts: string[];
}

export class WalletConnectProvider extends BaseProvider<BaseProviderConfig, WalletConnectProviderState, IConnector> {
  private connector: IConnector | null = null;

  constructor({ config, state, connector }: { config: WalletConnectProviderConfig; state?: BaseProviderState; connector?: IConnector }) {
    super({
      config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.EIP155 } },
      state: { ...(state || {}), chainId: "loading", accounts: [] },
    });
    this.connector = connector || null;
  }

  public static getProviderInstance = async (params: {
    connector: IConnector;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<SafeEventEmitterProvider> => {
    const providerFactory = new WalletConnectProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.connector);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.connector)
      throw ethErrors.provider.custom({ message: "Connector is not initialized, pass wallet connect connector in constructor", code: -32603 });
    await this.setupProvider(this.connector);
    return this._providerEngineProxy.sendAsync({ jsonrpc: "2.0", id: createRandomId(), method: "eth_accounts" });
  }

  public async setupProvider(connector: IConnector): Promise<void> {
    this.onConnectorStateUpdate(connector);
    await this.setupEngine(connector);
  }

  protected async lookupNetwork(connector: IConnector): Promise<string> {
    if (!connector.connected) throw WalletLoginError.notConnectedError("Wallet connect connector is not connected");
    const { chainId } = this.config.chainConfig;
    const connectedHexChainId = isHexStrict(connector.chainId.toString()) ? connector.chainId : `0x${connector.chainId.toString(16)}`;
    if (chainId !== connectedHexChainId)
      throw WalletInitializationError.rpcConnectionError(`Invalid network, net_version is: ${connectedHexChainId}, expected: ${chainId}`);
    return connectedHexChainId;
  }

  private async setupEngine(connector: IConnector): Promise<void> {
    const ethMiddleware = await this.getEthMiddleWare(connector);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    engine.push(ethMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    const providerWithRequest = {
      ...provider,
      request: async (args: RequestArguments) => {
        return provider.sendAsync({ jsonrpc: "2.0", id: createRandomId(), ...args });
      },
    } as SafeEventEmitterProvider;
    this._providerEngineProxy = createSwappableProxy<SafeEventEmitterProvider>(providerWithRequest);
    await this.lookupNetwork(connector);
  }

  private async getEthMiddleWare(connector: IConnector): Promise<JRPCMiddleware<unknown, unknown>> {
    this.update({
      accounts: connector.accounts || [],
    });
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
    connector.on("session_update", async (error: Error | null, payload) => {
      if (!this._providerEngineProxy) throw WalletLoginError.notConnectedError("Wallet connect connector is not connected");
      if (error) {
        this.emit("error", error);
        return;
      }
      const { accounts, chainId: connectedChainId, rpcUrl } = payload;
      // Check if accounts changed and trigger event
      if (accounts?.length && this.state.accounts[0] !== accounts[0]) {
        this.update({
          accounts,
        });
        // await this.setupEngine(connector);
        this.emit("accountsChanged", accounts);
      }
      const connectedHexChainId = isHexStrict(connectedChainId) ? connectedChainId : `0x${connectedChainId.toString(16)}`;
      // Check if chainId changed and trigger event
      if (connectedChainId && this.state.chainId !== connectedHexChainId) {
        this.update({ chainId: connectedHexChainId });
        // Handle rpcUrl update
        this.configure({
          chainConfig: { ...this.config.chainConfig, chainId: connectedHexChainId, rpcTarget: rpcUrl },
        });
        await this.setupEngine(connector);
        this.emit("chainChanged", this.config.chainConfig.chainId);
      }
    });
  }
}
