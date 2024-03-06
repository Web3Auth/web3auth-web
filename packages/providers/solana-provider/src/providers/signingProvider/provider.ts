import { providerErrors, rpcErrors } from "@metamask/rpc-errors";
import { JRPCEngine, JRPCMiddleware, JRPCRequest, providerFromEngine } from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES, CustomChainConfig, WalletInitializationError } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";

import { createJsonRpcClient } from "../../rpc/JrpcClient";
import {
  AddSolanaChainParameter,
  createAccountMiddleware,
  createChainSwitchMiddleware,
  createSolanaMiddleware,
  IAccountHandlers,
  IChainSwitchHandlers,
} from "../../rpc/solanaRpcMiddlewares";
import { SigningMethods } from ".";
import { getProviderHandlers } from "./utils";

export interface SolanaSigningProviderConfig extends BaseProviderConfig {
  chainConfig: CustomChainConfig;
}
export interface SolanaSigningProviderState extends BaseProviderState {
  signingMethods: SigningMethods;
}
export class SolanaSigningProvider extends BaseProvider<BaseProviderConfig, SolanaSigningProviderState, SigningMethods> {
  readonly PROVIDER_CHAIN_NAMESPACE = CHAIN_NAMESPACES.SOLANA;

  constructor({ config, state }: { config: SolanaSigningProviderConfig; state?: SolanaSigningProviderState }) {
    super({ config, state });
  }

  public static getProviderInstance = async (params: {
    signingMethods: SigningMethods;
    chainConfig: CustomChainConfig;
  }): Promise<SolanaSigningProvider> => {
    const providerFactory = new SolanaSigningProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.signingMethods);
    return providerFactory;
  };

  public async setupProvider(signingMethods: SigningMethods): Promise<void> {
    const { chainNamespace } = this.config.chainConfig;
    if (chainNamespace !== this.PROVIDER_CHAIN_NAMESPACE) throw WalletInitializationError.incompatibleChainNameSpace("Invalid chain namespace");
    const providerHandlers = await getProviderHandlers({ signingMethods, getProviderEngineProxy: this.getProviderEngineProxy.bind(this) });

    const solanaMiddleware = createSolanaMiddleware(providerHandlers);

    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    engine.push(this.getChainSwitchMiddleware());
    engine.push(this.getAccountMiddleware());
    engine.push(solanaMiddleware);
    engine.push(networkMiddleware);

    const provider = providerFromEngine(engine);

    this.updateProviderEngineProxy(provider);

    await this.lookupNetwork();
  }

  public async updateAccount(signingMethods: SigningMethods): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    await this.setupProvider(signingMethods);
    this.emit("accountsChanged", {
      accounts: await this._providerEngineProxy.request<never, string[]>({ method: "requestAccounts" }),
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
    const health = await this._providerEngineProxy.request<[], string>({
      method: "getHealth",
      params: [],
    });
    const { chainConfig } = this.config;
    if (health !== "ok")
      throw WalletInitializationError.rpcConnectionError(`Failed to lookup network for following rpc target: ${chainConfig.rpcTarget}`);
    this.update({ chainId: chainConfig.chainId });
    return this.state.chainId;
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IChainSwitchHandlers = {
      addNewChainConfig: async (req: JRPCRequest<AddSolanaChainParameter>): Promise<void> => {
        if (!req.params) throw rpcErrors.invalidParams("Missing request params");
        const { chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency, iconUrls } = req.params;

        if (!chainId) throw rpcErrors.invalidParams("Missing chainId in chainParams");
        if (!rpcUrls || rpcUrls.length === 0) throw rpcErrors.invalidParams("Missing rpcUrls in chainParams");
        if (!nativeCurrency) throw rpcErrors.invalidParams("Missing nativeCurrency in chainParams");
        this.addChain({
          chainNamespace: CHAIN_NAMESPACES.SOLANA,
          chainId,
          ticker: nativeCurrency?.symbol || "SOL",
          tickerName: nativeCurrency?.name || "Solana",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorerUrl: blockExplorerUrls?.[0] || "",
          decimals: nativeCurrency?.decimals || 9,
          logo: iconUrls?.[0] || "https://images.toruswallet.io/sol.svg",
        });
      },
      switchSolanaChain: async (req: JRPCRequest<{ chainId: string }>): Promise<void> => {
        if (!req.params) throw rpcErrors.invalidParams("Missing request params");
        if (!req.params.chainId) throw rpcErrors.invalidParams("Missing chainId");
        await this.switchChain(req.params);
      },
    };
    const chainSwitchMiddleware = createChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }

  private getAccountMiddleware(): JRPCMiddleware<unknown, unknown> {
    const accountHandlers: IAccountHandlers = {
      updatePrivatekey: async (_: JRPCRequest<{ privateKey: string }>): Promise<void> => {
        throw rpcErrors.invalidRequest("not supported");
      },
    };
    return createAccountMiddleware(accountHandlers);
  }
}
