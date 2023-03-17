import { providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCMiddleware, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES, CustomChainConfig, WalletInitializationError } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import { ethErrors } from "eth-rpc-errors";
import { PingResponse } from "xrpl";

import { createJsonRpcClient } from "../../rpc/JrpcClient";
import {
  AddXRPLChainParameter,
  createChainSwitchMiddleware,
  createXRPLMiddleware,
  IChainSwitchHandlers,
  KeyPair,
  RPC_METHODS,
} from "../../rpc/rippleRpcMiddlewares";
import { getProviderHandlers } from "./xrplWalletUtils";

export interface XrplPrivKeyProviderConfig extends BaseProviderConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}

export interface XrplPrivKeyProviderState extends BaseProviderState {
  privateKey?: string;
}
export class XrplPrivateKeyProvider extends BaseProvider<BaseProviderConfig, XrplPrivKeyProviderState, string> {
  constructor({ config, state }: { config: XrplPrivKeyProviderConfig; state?: XrplPrivKeyProviderState }) {
    super({ config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.OTHER } }, state });
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<XrplPrivateKeyProvider> => {
    const providerFactory = new XrplPrivateKeyProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.privKey);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.state.privateKey)
      throw ethErrors.provider.custom({ message: "Private key is not found in state, plz pass it in constructor state param", code: 4902 });
    await this.setupProvider(this.state.privateKey);
    return this._providerEngineProxy.request({ method: RPC_METHODS.GET_ACCOUNTS });
  }

  public async setupProvider(privKey: string): Promise<void> {
    const providerHandlers = getProviderHandlers({
      privKey,
      chainConfig: this.config.chainConfig,
    });
    const xrplWalletMiddleware = createXRPLMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createJsonRpcClient(this.config.chainConfig as CustomChainConfig);
    engine.push(this.getChainSwitchMiddleware());
    engine.push(xrplWalletMiddleware);
    engine.push(networkMiddleware);

    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);

    // await this.lookupNetwork();
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });
    const chainConfig = this.getChainConfig(params.chainId);
    this.update({
      chainId: "loading",
    });
    this.configure({ chainConfig });
    const { privateKey } = await this._providerEngineProxy.request<unknown, KeyPair>({ method: RPC_METHODS.GET_KEY_PAIR });
    await this.setupProvider(privateKey);
  }

  protected async lookupNetwork(): Promise<void> {
    if (!this._providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });
    const { chainId } = this.config.chainConfig;
    if (!chainId) throw ethErrors.rpc.invalidParams("chainId is required while lookupNetwork");

    const pingResponse = await this._providerEngineProxy.request<string[], PingResponse>({
      method: "ping",
      params: [],
    });

    if (pingResponse?.status !== "success") {
      const { chainConfig } = this.config;
      throw WalletInitializationError.rpcConnectionError(`Failed to ping network for following rpc target: ${chainConfig.rpcTarget}`);
    }

    if (this.state.chainId !== chainId) {
      this._providerEngineProxy.emit("chainChanged", chainId);
      this._providerEngineProxy.emit("connect", { chainId });
    }
    this.update({ chainId });
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IChainSwitchHandlers = {
      addChainConfig: async (req: JRPCRequest<AddXRPLChainParameter>): Promise<void> => {
        if (!req.params) throw ethErrors.rpc.invalidParams("Missing request params");
        const { chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency } = req.params;

        if (!chainId) throw ethErrors.rpc.invalidParams("Missing chainId in chainParams");
        if (!rpcUrls || rpcUrls.length === 0) throw ethErrors.rpc.invalidParams("Missing rpcUrls in chainParams");
        if (!nativeCurrency) throw ethErrors.rpc.invalidParams("Missing nativeCurrency in chainParams");
        this.addChain({
          chainNamespace: CHAIN_NAMESPACES.SOLANA,
          chainId,
          ticker: nativeCurrency?.symbol || "SOL",
          tickerName: nativeCurrency?.name || "Solana",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorer: blockExplorerUrls?.[0] || "",
        });
      },
      switchChain: async (req: JRPCRequest<{ chainId: string }>): Promise<void> => {
        if (!req.params) throw ethErrors.rpc.invalidParams("Missing request params");
        if (!req.params.chainId) throw ethErrors.rpc.invalidParams("Missing chainId");
        await this.switchChain(req.params);
      },
    };
    const chainSwitchMiddleware = createChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }
}
