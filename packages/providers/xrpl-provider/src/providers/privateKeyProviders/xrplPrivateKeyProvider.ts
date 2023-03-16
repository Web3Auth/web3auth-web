import { providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine } from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";
import { ethErrors } from "eth-rpc-errors";

import { createXRPLMiddleware, KeyPair, RPC_METHODS } from "../../rpc/rippleRpcMiddlewares";
import { getProviderHandlers } from "./xrplWalletUtils";

export interface XrplPrivKeyProviderConfig extends BaseProviderConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}

export interface XrplPrivKeyProviderState extends BaseProviderState {
  privateKey?: string;
}
export class XrplPrivateKeyProvider extends BaseProvider<BaseProviderConfig, XrplPrivKeyProviderState, string> {
  constructor({ config, state }: { config: XrplPrivKeyProviderConfig; state?: XrplPrivKeyProviderState }) {
    super({ config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.EIP155 } }, state });
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
    });
    const xrplWalletMiddleware = createXRPLMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    engine.push(xrplWalletMiddleware);
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
    // const { chainId } = this.config.chainConfig;
    // if (!chainId) throw ethErrors.rpc.invalidParams("chainId is required while lookupNetwork");
    // const network = await this._providerEngineProxy.request<string[], string>({
    //   method: "net_version",
    //   params: [],
    // });

    // if (parseInt(chainId, 16) !== parseInt(network, 10)) throw ethErrors.provider.chainDisconnected(`Invalid network, net_version is: ${network}`);
    // if (this.state.chainId !== chainId) {
    //   this._providerEngineProxy.emit("chainChanged", chainId);
    //   this._providerEngineProxy.emit("connect", { chainId });
    // }
    // this.update({ chainId });
    // return network;
  }
}
