import { providerErrors, rpcErrors } from "@metamask/rpc-errors";
import { JRPCEngine, JRPCMiddleware, providerFromEngine } from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES, CustomChainConfig, WalletInitializationError } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";

import { createAccountMiddleware, createChainSwitchMiddleware, createEthMiddleware } from "../../rpc/ethRpcMiddlewares";
import { AddEthereumChainParameter, IAccountHandlers, IChainSwitchHandlers } from "../../rpc/interfaces";
import { createJsonRpcClient } from "../../rpc/jrpcClient";
import { TransactionFormatter } from "../privateKeyProviders/TransactionFormatter";
import { SigningMethods } from ".";
import { getProviderHandlers } from "./utils";

export interface EthereumSigningProviderConfig extends BaseProviderConfig {
  chainConfig: CustomChainConfig;
}

export interface EthereumSigningProviderState extends BaseProviderState {
  signingMethods: SigningMethods;
}

export class EthereumSigningProvider extends BaseProvider<BaseProviderConfig, EthereumSigningProviderState, SigningMethods> {
  readonly PROVIDER_CHAIN_NAMESPACE = CHAIN_NAMESPACES.EIP155;

  constructor({ config, state }: { config: EthereumSigningProviderConfig; state?: EthereumSigningProviderState }) {
    super({ config, state });
  }

  public static getProviderInstance = async (params: {
    signingMethods: SigningMethods;
    chainConfig: CustomChainConfig;
  }): Promise<EthereumSigningProvider> => {
    const providerFactory = new EthereumSigningProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.signingMethods);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    // TODO: check that state.sign and state.getPubKey are set?
    await this.setupProvider(this.state.signingMethods);
    return this._providerEngineProxy.request({ method: "eth_accounts" });
  }

  public async setupProvider(signingMethods: SigningMethods): Promise<void> {
    const { chainNamespace } = this.config.chainConfig;
    if (chainNamespace !== this.PROVIDER_CHAIN_NAMESPACE) throw WalletInitializationError.incompatibleChainNameSpace("Invalid chain namespace");
    const txFormatter = new TransactionFormatter({
      getProviderEngineProxy: this.getProviderEngineProxy.bind(this),
    });
    const providerHandlers = getProviderHandlers({
      txFormatter,
      signingMethods,
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

  public async updateAccount(signingMethods: SigningMethods): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    await this.setupProvider(signingMethods);
    this.emit("accountsChanged", {
      accounts: await this._providerEngineProxy.request({ method: "eth_accounts" }),
    });
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    const chainConfig = this.getChainConfig(params.chainId);
    this.update({
      chainId: "loading",
    });
    this.configure({ chainConfig });
    await this.setupProvider(this.state.signingMethods);
  }

  protected async lookupNetwork(): Promise<string> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    const { chainId } = this.config.chainConfig;
    if (!chainId) throw rpcErrors.invalidParams("chainId is required while lookupNetwork");
    const network = await this._providerEngineProxy.request<string[], string>({
      method: "net_version",
      params: [],
    });

    if (parseInt(chainId, 16) !== parseInt(network, 10)) throw providerErrors.chainDisconnected(`Invalid network, net_version is: ${network}`);
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
      updatePrivatekey: async (_: { privateKey: string }): Promise<void> => {
        throw rpcErrors.invalidParams("unsupported");
      },
    };
    return createAccountMiddleware(accountHandlers);
  }
}
