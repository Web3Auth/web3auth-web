import { getED25519Key, JRPCEngine, JRPCMiddleware, JRPCRequest, providerErrors, providerFromEngine, rpcErrors } from "@web3auth/auth";

import { CHAIN_NAMESPACES, CustomChainConfig, WalletInitializationError } from "@/core/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@/core/base-provider";

import { ISolanaChainSwitchHandlers } from "../../rpc";
import { createSolanaJsonRpcClient } from "../../rpc/JrpcClient";
import {
  createSolanaAccountMiddleware,
  createSolanaChainSwitchMiddleware,
  createSolanaMiddleware,
  ISolanaAccountHandlers,
} from "../../rpc/solanaRpcMiddlewares";
import { getProviderHandlers } from "./solanaPrivateKeyUtils";

export type SolanaPrivKeyProviderConfig = BaseProviderConfig;
export interface SolanaPrivKeyProviderState extends BaseProviderState {
  privateKey?: string;
}
export class SolanaPrivateKeyProvider extends BaseProvider<BaseProviderConfig, SolanaPrivKeyProviderState, string> {
  readonly PROVIDER_CHAIN_NAMESPACE = CHAIN_NAMESPACES.SOLANA;

  constructor({ config, state }: { config: SolanaPrivKeyProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chain: CustomChainConfig;
    chains: CustomChainConfig[];
  }): Promise<SolanaPrivateKeyProvider> => {
    const providerFactory = new SolanaPrivateKeyProvider({ config: { chain: params.chain, chains: params.chains } });
    await providerFactory.setupProvider(params.privKey, params.chain.chainId);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.state.privateKey)
      throw providerErrors.custom({ message: "Private key is not found in state, plz pass it in constructor state param", code: 4902 });
    await this.setupProvider(this.state.privateKey, this.chainId);
    return this._providerEngineProxy.request<never, string[]>({ method: "eth_accounts" });
  }

  public getEd25519Key(privateKey: string): string {
    return getED25519Key(privateKey).sk.toString("hex").padStart(128, "0");
  }

  public async setupProvider(privKey: string, chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    const { chainNamespace } = chain;
    if (chainNamespace !== this.PROVIDER_CHAIN_NAMESPACE) throw WalletInitializationError.incompatibleChainNameSpace("Invalid chain namespace");
    const providerHandlers = await getProviderHandlers({
      privKey,
      getProviderEngineProxy: this.getProviderEngineProxy.bind(this),
      keyExportEnabled: this.config.keyExportEnabled,
    });

    const solanaMiddleware = createSolanaMiddleware(providerHandlers);

    const engine = new JRPCEngine();
    const { networkMiddleware } = createSolanaJsonRpcClient(chain);
    engine.push(this.getChainSwitchMiddleware());
    engine.push(this.getAccountMiddleware());
    engine.push(solanaMiddleware);
    engine.push(networkMiddleware);

    const provider = providerFromEngine(engine);

    this.updateProviderEngineProxy(provider);

    await this.lookupNetwork(chainId);

    this.emit("chainChanged", chainId);
    this.emit("connect", { chainId });

    this.update({ chainId });
  }

  public async updateAccount(params: { privateKey: string }): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    const existingKey = await this._providerEngineProxy.request<never, string>({ method: "solanaPrivateKey" });
    if (existingKey !== params.privateKey) {
      await this.setupProvider(params.privateKey, this.chainId);
      const accounts = await this._providerEngineProxy.request<never, string[]>({ method: "requestAccounts" });
      this.emit("accountsChanged", accounts);
    }
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    const newChainId = params.chainId;
    if (this.chainId === newChainId) return;

    this.update({
      chainId: "loading",
    });

    const privKey = await this._providerEngineProxy.request<never, string>({ method: "solanaPrivateKey" });

    await this.setupProvider(privKey, newChainId);
  }

  protected async lookupNetwork(chainId: string) {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    const health = await this._providerEngineProxy.request<[], string>({
      method: "getHealth",
      params: [],
    });
    const chain = this.getChain(chainId);
    if (health !== "ok") throw WalletInitializationError.rpcConnectionError(`Failed to lookup network for following rpc target: ${chain.rpcTarget}`);
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: ISolanaChainSwitchHandlers = {
      switchSolanaChain: async (req: JRPCRequest<{ chainId: string }>): Promise<void> => {
        if (!req.params) throw rpcErrors.invalidParams("Missing request params");
        if (!req.params.chainId) throw rpcErrors.invalidParams("Missing chainId");
        await this.switchChain(req.params);
      },
    };
    const chainSwitchMiddleware = createSolanaChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }

  private getAccountMiddleware(): JRPCMiddleware<unknown, unknown> {
    const accountHandlers: ISolanaAccountHandlers = {
      updatePrivatekey: async (req: JRPCRequest<{ privateKey: string }>): Promise<void> => {
        if (!req.params) throw rpcErrors.invalidParams("Missing request params");
        if (!req.params.privateKey) throw rpcErrors.invalidParams("Missing privateKey");
        const { privateKey } = req.params;
        await this.updateAccount({ privateKey });
      },
    };
    return createSolanaAccountMiddleware(accountHandlers);
  }
}
