import { providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCMiddleware } from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import { ethErrors } from "eth-rpc-errors";

import { createAccountMiddleware, createChainSwitchMiddleware, createEthMiddleware } from "../../rpc/ethRpcMiddlewares";
import { AddEthereumChainParameter, IAccountHandlers, IChainSwitchHandlers } from "../../rpc/interfaces";
import { createJsonRpcClient } from "../../rpc/jrpcClient";
import { TransactionFormatter } from "../TransactionFormatter";
import { getProviderHandlers } from "./signingUtils";

export interface EthereumSigningProviderConfig extends BaseProviderConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}

export interface EthereumSigningProviderState extends BaseProviderState {
  privateKey?: string;
  signMethods?: {
    sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
    getPublic: () => Promise<Buffer>;
  };
}
export class EthereumSigningProvider extends BaseProvider<
  BaseProviderConfig,
  EthereumSigningProviderState,
  {
    sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
    getPublic: () => Promise<Buffer>;
  }
> {
  constructor({ config, state }: { config: EthereumSigningProviderConfig; state?: EthereumSigningProviderState }) {
    super({ config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.EIP155 } }, state });
  }

  public static getProviderInstance = async (params: {
    signMethods: {
      sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    };
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<EthereumSigningProvider> => {
    const providerFactory = new EthereumSigningProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.signMethods);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.state.privateKey)
      throw ethErrors.provider.custom({ message: "Private key is not found in state, plz pass it in constructor state param", code: 4902 });
    await this.setupProvider(this.state.signMethods);
    return this._providerEngineProxy.request({ method: "eth_accounts" });
  }

  public async setupProvider({ sign, getPublic }): Promise<void> {
    const txFormatter = new TransactionFormatter({
      getProviderEngineProxy: this.getProviderEngineProxy.bind(this),
    });
    const providerHandlers = getProviderHandlers({
      txFormatter,
      sign,
      getPublic,
      getProviderEngineProxy: this.getProviderEngineProxy.bind(this),
    });
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const chainSwitchMiddleware = this.getChainSwitchMiddleware();
    const engine = new JRPCEngine();
    // Not a partial anymore because of checks in ctor
    const { networkMiddleware } = createJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    engine.push(ethMiddleware);
    engine.push(chainSwitchMiddleware);
    engine.push(this.getAccountMiddleware());
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    await txFormatter.init();
    await this.lookupNetwork();
  }

  public async updateAccount(params: {
    signMethods: {
      sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    };
  }): Promise<void> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });
    const currentSignMethods = this.state.signMethods;
    if (!currentSignMethods) {
      throw ethErrors.provider.custom({ message: "signing methods are unavailable ", code: 4092 });
    }
    const currentPubKey = (await currentSignMethods.getPublic()).toString("hex");
    const updatePubKey = (await params.signMethods.getPublic()).toString("hex");
    if (currentPubKey !== updatePubKey) {
      await this.setupProvider(params.signMethods);
      this._providerEngineProxy.emit("accountsChanged", {
        accounts: await this._providerEngineProxy.request<unknown, string[]>({ method: "eth_accounts" }),
      });
    }
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });
    const chainConfig = this.getChainConfig(params.chainId);
    this.update({
      chainId: "loading",
    });
    this.configure({ chainConfig });
    if (!this.state.signMethods) {
      throw ethErrors.provider.custom({ message: "sign methods are undefined", code: 4902 });
    }
    await this.setupProvider(this.state.signMethods);
  }

  protected async lookupNetwork(): Promise<string> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });
    const { chainId } = this.config.chainConfig;
    if (!chainId) throw ethErrors.rpc.invalidParams("chainId is required while lookupNetwork");
    const network = await this._providerEngineProxy.request<string[], string>({
      method: "net_version",
      params: [],
    });

    if (parseInt(chainId, 16) !== parseInt(network, 10)) throw ethErrors.provider.chainDisconnected(`Invalid network, net_version is: ${network}`);
    if (this.state.chainId !== chainId) {
      this._providerEngineProxy.emit("chainChanged", chainId);
      this._providerEngineProxy.emit("connect", { chainId });
    }
    this.update({ chainId });
    return network;
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IChainSwitchHandlers = {
      addChain: async (params: AddEthereumChainParameter): Promise<void> => {
        const { chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency } = params;
        this.addChain({
          chainNamespace: "eip155",
          chainId,
          ticker: nativeCurrency?.symbol || "ETH",
          tickerName: nativeCurrency?.name || "Ether",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorer: blockExplorerUrls?.[0] || "",
        });
      },
      switchChain: async (params: { chainId: string }): Promise<void> => {
        const { chainId } = params;
        await this.switchChain({ chainId });
      },
    };
    const chainSwitchMiddleware = createChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }

  private getAccountMiddleware(): JRPCMiddleware<unknown, unknown> {
    const accountHandlers: IAccountHandlers = {
      updateSignMethods: async (params: {
        signMethods: {
          sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
          getPublic: () => Promise<Buffer>;
        };
      }): Promise<void> => {
        await this.updateAccount(params);
      },
    };
    return createAccountMiddleware(accountHandlers);
  }
}
