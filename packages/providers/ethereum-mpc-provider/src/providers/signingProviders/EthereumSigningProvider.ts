import { isHexString } from "@ethereumjs/util";
import { JRPCEngine, JRPCMiddleware, providerErrors, providerFromEngine, rpcErrors } from "@web3auth/auth";
import { CHAIN_NAMESPACES, CustomChainConfig, WalletInitializationError } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import {
  AddEthereumChainParameter,
  createChainSwitchMiddleware,
  createEthMiddleware,
  createJsonRpcClient,
  IChainSwitchHandlers,
  TransactionFormatter,
} from "@web3auth/ethereum-provider";

import { createAccountMiddleware } from "../../rpc/ethRpcMiddlewares";
import { IAccountHandlers } from "../../rpc/interfaces";
import { getProviderHandlers } from "./signingUtils";

export interface EthereumSigningProviderConfig extends BaseProviderConfig {
  chainConfig: CustomChainConfig;
}

export interface EthereumSigningProviderState extends BaseProviderState {
  signMethods?: {
    sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
    getPublic: () => Promise<Buffer>;
  };
}
export class EthereumSigningProvider extends BaseProvider<
  BaseProviderConfig,
  EthereumSigningProviderState,
  {
    sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
    getPublic: () => Promise<Buffer>;
  }
> {
  readonly PROVIDER_CHAIN_NAMESPACE = CHAIN_NAMESPACES.EIP155;

  constructor({ config, state }: { config: EthereumSigningProviderConfig; state?: EthereumSigningProviderState }) {
    super({ config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.EIP155 } }, state });
  }

  public static getProviderInstance = async (params: {
    signMethods: {
      sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    };
    chainConfig: CustomChainConfig;
  }): Promise<EthereumSigningProvider> => {
    const providerFactory = new EthereumSigningProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.signMethods);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.state.signMethods)
      throw providerErrors.custom({ message: "signMethods are not found in state, plz pass it in constructor state param", code: 4902 });
    await this.setupProvider(this.state.signMethods);
    return this._providerEngineProxy.request({ method: "eth_accounts" });
  }

  public async setupProvider({
    sign,
    getPublic,
  }: {
    sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
    getPublic: () => Promise<Buffer>;
  }): Promise<void> {
    const { chainNamespace } = this.config.chainConfig;
    if (chainNamespace !== this.PROVIDER_CHAIN_NAMESPACE) throw WalletInitializationError.incompatibleChainNameSpace("Invalid chain namespace");
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
    this.state.signMethods = { sign, getPublic };
  }

  public async updateAccount(params: {
    signMethods: {
      sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    };
  }): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    const currentSignMethods = this.state.signMethods;
    if (!currentSignMethods) {
      throw providerErrors.custom({ message: "signing methods are unavailable ", code: 4092 });
    }
    const currentPubKey = (await currentSignMethods.getPublic()).toString("hex");
    const updatePubKey = (await params.signMethods.getPublic()).toString("hex");
    if (currentPubKey !== updatePubKey) {
      await this.setupProvider(params.signMethods);
      const accounts = await this._providerEngineProxy.request<never, string[]>({ method: "eth_accounts" });
      this.emit("accountsChanged", accounts);
    }
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    const chainConfig = this.getChainConfig(params.chainId);
    this.update({
      chainId: "loading",
    });
    this.configure({ chainConfig });
    if (!this.state.signMethods) {
      throw providerErrors.custom({ message: "sign methods are undefined", code: 4902 });
    }
    await this.setupProvider(this.state.signMethods);
  }

  protected async lookupNetwork(): Promise<string> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    const { chainId } = this.config.chainConfig;
    if (!chainId) throw rpcErrors.invalidParams("chainId is required while lookupNetwork");
    const network = await this._providerEngineProxy.request<string[], string>({
      method: "net_version",
      params: [],
    });

    const finalNetwork = isHexString(network) ? parseInt(network, 16) : parseInt(network, 10);

    if (parseInt(chainId, 16) !== finalNetwork) throw providerErrors.chainDisconnected(`Invalid network, net_version is: ${network}`);
    if (this.state.chainId !== chainId) {
      this.emit("chainChanged", chainId);
      this.emit("connect", { chainId });
    }
    this.update({ chainId });
    return network;
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IChainSwitchHandlers = {
      addChain: async (params: AddEthereumChainParameter): Promise<void> => {
        const { chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency, iconUrls } = params;
        this.addChain({
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId,
          ticker: nativeCurrency?.symbol || "ETH",
          tickerName: nativeCurrency?.name || "Ether",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorerUrl: blockExplorerUrls?.[0] || "",
          decimals: nativeCurrency?.decimals || 18,
          logo: iconUrls?.[0] || "https://images.toruswallet.io/eth.svg",
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
          sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
          getPublic: () => Promise<Buffer>;
        };
      }): Promise<void> => {
        await this.updateAccount(params);
      },
    };
    return createAccountMiddleware(accountHandlers);
  }
}
