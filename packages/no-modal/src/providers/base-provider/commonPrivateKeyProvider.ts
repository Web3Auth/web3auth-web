import { createScaffoldMiddlewareV2, JRPCEngineV2, type MiddlewareConstraint, providerFromEngineV2 } from "@web3auth/auth";

import { CustomChainConfig, IBaseProvider, SafeEventEmitterProvider } from "../../base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "./baseProvider";

export type CommonPrivKeyProviderConfig = BaseProviderConfig;

export interface CommonPrivKeyProviderState extends BaseProviderState {
  privateKey?: string;
}

export class CommonPrivateKeyProvider extends BaseProvider<BaseProviderConfig, CommonPrivKeyProviderState, string> implements IBaseProvider<string> {
  // should be Assigned in setupProvider
  public _providerEngineProxy: SafeEventEmitterProvider | null = null;

  constructor({ config, state }: { config: CommonPrivKeyProviderConfig; state?: CommonPrivKeyProviderState }) {
    super({ config, state });
  }

  get provider(): SafeEventEmitterProvider | null {
    return this._providerEngineProxy;
  }

  set provider(_) {
    throw new Error("Method not implemented.");
  }

  public static getProviderInstance = async (params: {
    privKey: string;
    chain: CustomChainConfig;
    chains: CustomChainConfig[];
  }): Promise<CommonPrivateKeyProvider> => {
    const providerFactory = new CommonPrivateKeyProvider({ config: { chain: params.chain, chains: params.chains } });
    await providerFactory.setupProvider(params.privKey);
    return providerFactory;
  };

  public async setupProvider(privKey: string): Promise<void> {
    const privKeyMiddleware = this.getPrivKeyMiddleware(privKey);
    const engine = JRPCEngineV2.create({ middleware: [privKeyMiddleware] });
    const provider = providerFromEngineV2(engine);
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

  private getPrivKeyMiddleware(privKey: string): MiddlewareConstraint {
    const middleware = {
      getPrivatekey: async (): Promise<string> => {
        if (!this.config.keyExportEnabled) throw new Error("Exporting private key is disabled. Please enable it in the provider config");
        return privKey;
      },
    };
    return this.createPrivKeyMiddleware(middleware);
  }

  private createPrivKeyMiddleware({ getPrivatekey }: { getPrivatekey: () => Promise<string> }): MiddlewareConstraint {
    async function getPrivatekeyHandler(): Promise<string> {
      return getPrivatekey();
    }

    return createScaffoldMiddlewareV2({
      private_key: getPrivatekeyHandler,
    });
  }
}
