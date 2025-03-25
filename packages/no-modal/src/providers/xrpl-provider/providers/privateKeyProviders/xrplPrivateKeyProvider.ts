import { JRPCEngine, JRPCMiddleware, JRPCRequest, providerErrors, providerFromEngine, rpcErrors } from "@web3auth/auth";
import type { PingResponse } from "xrpl";

import { CHAIN_NAMESPACES, CustomChainConfig, WalletInitializationError } from "@/core/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@/core/base-provider";

import { createXrplJsonRpcClient } from "../../rpc/JrpcClient";
import { createXRPLMiddleware, creatXrplChainSwitchMiddleware, IXrplChainSwitchHandlers, KeyPair, RPC_METHODS } from "../../rpc/xrplRpcMiddlewares";
import { getProviderHandlers } from "./xrplWalletUtils";

export type XrplPrivKeyProviderConfig = BaseProviderConfig;

export interface XrplPrivKeyProviderState extends BaseProviderState {
  privateKey?: string;
}
export class XrplPrivateKeyProvider extends BaseProvider<BaseProviderConfig, XrplPrivKeyProviderState, string> {
  readonly PROVIDER_CHAIN_NAMESPACE = CHAIN_NAMESPACES.XRPL;

  constructor({ config, state }: { config: XrplPrivKeyProviderConfig; state?: XrplPrivKeyProviderState }) {
    super({ config, state });
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chain: CustomChainConfig;
    chains: CustomChainConfig[];
  }): Promise<XrplPrivateKeyProvider> => {
    const providerFactory = new XrplPrivateKeyProvider({ config: { chain: params.chain, chains: params.chains } });
    await providerFactory.setupProvider(params.privKey, params.chain.chainId);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.state.privateKey)
      throw providerErrors.custom({ message: "Private key is not found in state, plz pass it in constructor state param", code: 4902 });
    await this.setupProvider(this.state.privateKey, this.chainId);
    return this._providerEngineProxy.request({ method: RPC_METHODS.GET_ACCOUNTS });
  }

  public async setupProvider(privKey: string, chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    const { wsTarget, chainNamespace } = chain;
    if (chainNamespace !== this.PROVIDER_CHAIN_NAMESPACE) throw WalletInitializationError.incompatibleChainNameSpace("Invalid chain namespace");
    if (!wsTarget) {
      throw WalletInitializationError.invalidParams(`wsTarget is required in chainConfig for xrplProvider`);
    }
    const providerHandlers = await getProviderHandlers({
      privKey,
      chainConfig: chain,
      keyExportEnabled: this.config.keyExportEnabled,
    });
    const xrplWalletMiddleware = createXRPLMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    const { networkMiddleware } = createXrplJsonRpcClient(chain);
    engine.push(this.getChainSwitchMiddleware());
    engine.push(xrplWalletMiddleware);
    engine.push(networkMiddleware);

    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);

    await this.lookupNetwork(privKey, chainId);

    this.emit("chainChanged", chainId);
    this.emit("connect", { chainId });

    this.update({ chainId });
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    if (this.chainId === params.chainId) return;

    this.update({
      chainId: "loading",
    });

    const { privateKey } = await this._providerEngineProxy.request<never, KeyPair>({ method: RPC_METHODS.GET_KEY_PAIR });
    await this.setupProvider(privateKey, params.chainId);
  }

  protected async lookupNetwork(_privKey: string, chainId: string): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    if (!chainId) throw rpcErrors.invalidParams("chainId is required while lookupNetwork");

    const pingResponse = await this._providerEngineProxy.request<[], PingResponse>({
      method: "ping",
      params: [],
    });

    if (pingResponse?.status !== "success") {
      const chain = this.getChain(chainId);
      throw WalletInitializationError.rpcConnectionError(`Failed to ping network for following rpc target: ${chain.rpcTarget}`);
    }
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IXrplChainSwitchHandlers = {
      switchChain: async (req: JRPCRequest<{ chainId: string }>): Promise<void> => {
        if (!req.params) throw rpcErrors.invalidParams("Missing request params");
        if (!req.params.chainId) throw rpcErrors.invalidParams("Missing chainId");
        await this.switchChain(req.params);
      },
    };
    const chainSwitchMiddleware = creatXrplChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }
}
