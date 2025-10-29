import { isHexString } from "@ethereumjs/util";
import { JRPCEngine, JRPCMiddleware, providerErrors, providerFromEngine, rpcErrors } from "@web3auth/auth";

import { CHAIN_NAMESPACES, CustomChainConfig, WalletInitializationError } from "../../../../base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "../../../../providers/base-provider";
import {
  createEthChainSwitchMiddleware,
  createEthJsonRpcClient,
  createEthMiddleware,
  IEthChainSwitchHandlers,
  TransactionFormatter,
} from "../../../ethereum-provider";
import { createEthAccountMiddleware } from "../../rpc/ethRpcMiddlewares";
import { IAccountHandlers } from "../../rpc/interfaces";
import { getProviderHandlers } from "./signingUtils";

interface ProviderParams {
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
  getPublic: () => Promise<Buffer>;
}

export type EthereumSigningProviderConfig = BaseProviderConfig;

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
    super({
      config: {
        chain: {
          ...config.chain,
          chainNamespace: CHAIN_NAMESPACES.EIP155, // TODO: is this needed ?
        },
        chains: config.chains,
      },
      state,
    });
  }

  public static getProviderInstance = async (params: {
    signMethods: {
      sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    };
    chain: CustomChainConfig;
    chains: CustomChainConfig[];
  }): Promise<EthereumSigningProvider> => {
    const providerFactory = new EthereumSigningProvider({ config: { chain: params.chain, chains: params.chains } });
    await providerFactory.setupProvider(params.signMethods, params.chain.chainId);
    return providerFactory;
  };

  public async enable(): Promise<string[]> {
    if (!this.state.signMethods)
      throw providerErrors.custom({ message: "signMethods are not found in state, plz pass it in constructor state param", code: 4902 });
    await this.setupProvider(this.state.signMethods, this.chainId);
    return this._providerEngineProxy.request({ method: "eth_accounts" });
  }

  public async setupProvider(
    params: {
      sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    },
    chainId: string
  ): Promise<void> {
    const { sign, getPublic } = params;
    const chain = this.getChain(chainId);
    const { chainNamespace } = chain;
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
    const { networkMiddleware } = createEthJsonRpcClient(chain);
    engine.push(ethMiddleware);
    engine.push(chainSwitchMiddleware);
    engine.push(this.getAccountMiddleware());
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    await txFormatter.init();
    await this.lookupNetwork(params, chainId);
    this.state.signMethods = { sign, getPublic };

    this.emit("chainChanged", chainId);
    this.emit("connect", { chainId });

    this.update({ chainId });
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
      await this.setupProvider(params.signMethods, this.chainId);
      const accounts = await this._providerEngineProxy.request<never, string[]>({ method: "eth_accounts" });
      this.emit("accountsChanged", accounts);
    }
  }

  public async switchChain(params: { chainId: string }): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    if (!this.state.signMethods) {
      throw providerErrors.custom({ message: "sign methods are undefined", code: 4902 });
    }

    if (params.chainId === this.chainId) {
      return;
    }

    this.update({
      chainId: "loading",
    });

    await this.setupProvider(this.state.signMethods, params.chainId);
  }

  public async addChain(chainConfig: CustomChainConfig): Promise<void> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    if (!this.state.signMethods) {
      throw providerErrors.custom({ message: "sign methods are undefined", code: 4902 });
    }
    // find existing chain config with the same chainId
    const existingChain = this.config.chains.find((chain) => chain.chainId === chainConfig.chainId);
    if (existingChain) {
      return;
    }
    // add the chain config to the config
    this.config.chains.push(chainConfig);
  }

  protected async lookupNetwork(_: ProviderParams, chainId: string): Promise<string> {
    if (!this._providerEngineProxy) throw providerErrors.custom({ message: "Provider is not initialized", code: 4902 });
    if (!chainId) throw rpcErrors.invalidParams("chainId is required while lookupNetwork");
    const network = await this._providerEngineProxy.request<string[], string>({
      method: "net_version",
      params: [],
    });

    const finalNetwork = isHexString(network) ? parseInt(network, 16) : parseInt(network, 10);

    if (parseInt(chainId, 16) !== finalNetwork) throw providerErrors.chainDisconnected(`Invalid network, net_version is: ${network}`);
    return network;
  }

  private getChainSwitchMiddleware(): JRPCMiddleware<unknown, unknown> {
    const chainSwitchHandlers: IEthChainSwitchHandlers = {
      switchChain: async (params: { chainId: string }): Promise<void> => {
        const { chainId } = params;
        await this.switchChain({ chainId });
      },
      addChain: async (params: { chainConfig: CustomChainConfig }): Promise<void> => {
        await this.addChain(params.chainConfig);
      },
    };
    const chainSwitchMiddleware = createEthChainSwitchMiddleware(chainSwitchHandlers);
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
    return createEthAccountMiddleware(accountHandlers);
  }
}
