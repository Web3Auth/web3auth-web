import { createEventEmitterProxy } from "@toruslabs/base-controllers";
import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCEngine,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  providerFromEngine,
} from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES, CustomChainConfig, SafeEventEmitterProvider } from "@web3auth/base";

import { BaseProvider, BaseProviderConfig, BaseProviderState } from "./baseProvider";
import { IBaseProvider } from "./IBaseProvider";

export interface CommonPrivKeyProviderConfig extends BaseProviderConfig {
  chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}

export interface CommonPrivKeyProviderState extends BaseProviderState {
  privateKey?: string;
}

export class CommonPrivateKeyProvider extends BaseProvider<BaseProviderConfig, CommonPrivKeyProviderState, string> implements IBaseProvider<string> {
  // should be Assigned in setupProvider
  public _providerEngineProxy: SafeEventEmitterProvider | null = null;

  constructor({ config, state }: { config: CommonPrivKeyProviderConfig; state?: CommonPrivKeyProviderState }) {
    super({ config: { chainConfig: { ...config.chainConfig, chainNamespace: CHAIN_NAMESPACES.OTHER } }, state });
  }

  get provider(): SafeEventEmitterProvider | null {
    return this._providerEngineProxy;
  }

  set provider(_) {
    throw new Error("Method not implemented.");
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
  }): Promise<CommonPrivateKeyProvider> => {
    const providerFactory = new CommonPrivateKeyProvider({ config: { chainConfig: params.chainConfig } });
    await providerFactory.setupProvider(params.privKey);
    return providerFactory;
  };

  addChain(_: CustomChainConfig): void {
    throw new Error("Method not implemented.");
  }

  public async setupProvider(privKey: string): Promise<void> {
    const privKeyMiddleware = this.getPrivKeyMiddleware(privKey);
    const engine = new JRPCEngine();
    engine.push(privKeyMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }

  public async switchChain(_: { chainId: string }): Promise<void> {
    return Promise.resolve();
  }

  protected getProviderEngineProxy(): SafeEventEmitterProvider | null {
    return this._providerEngineProxy;
  }

  protected async lookupNetwork(): Promise<string> {
    return Promise.resolve("");
  }

  protected updateProviderEngineProxy(provider: SafeEventEmitterProvider) {
    if (this._providerEngineProxy) {
      (this._providerEngineProxy as any).setTarget(provider);
    } else {
      this._providerEngineProxy = createEventEmitterProxy<SafeEventEmitterProvider>(provider);
    }
  }

  private getPrivKeyMiddleware(privKey: string): JRPCMiddleware<unknown, unknown> {
    const middleware = {
      getPrivatekey: async (): Promise<string> => {
        return privKey;
      },
    };
    return this.createPrivKeyMiddleware(middleware);
  }

  private createPrivKeyMiddleware({ getPrivatekey }): JRPCMiddleware<unknown, unknown> {
    async function getPrivatekeyHandler(_: JRPCRequest<{ privateKey: string }[]>, res: JRPCResponse<unknown>): Promise<void> {
      res.result = await getPrivatekey();
    }

    return createScaffoldMiddleware({
      private_key: createAsyncMiddleware(getPrivatekeyHandler),
    });
  }
}
