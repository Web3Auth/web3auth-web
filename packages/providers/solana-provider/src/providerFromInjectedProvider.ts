import { BaseConfig, BaseController, BaseState, createSwappableProxy, providerFromEngine } from "@toruslabs/base-controllers";
import { JRPCEngine } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig, PROVIDER_EVENTS, ProviderNotReadyError, SafeEventEmitterProvider } from "@web3auth/base";

import { createInjectedProviderProxyMiddleware } from "./injectedProviderProxyMiddleware";
import { ISolanaWallet } from "./interface";

interface SolanaInjectedProviderState extends BaseState {
  _initialized: boolean;
  _errored: boolean;
  error: Error;
}

type SolanaInjectedProviderConfig = BaseConfig;
export class SolanaInjectedProviderProxy extends BaseController<SolanaInjectedProviderConfig, SolanaInjectedProviderState> {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  constructor({ config, state }: { config?: SolanaInjectedProviderConfig; state?: SolanaInjectedProviderState }) {
    super({ config, state });
    this.defaultState = {
      _initialized: false,
      _errored: false,
      error: null,
    };
    this.init();
  }

  public async init(): Promise<void> {
    this.update({
      _initialized: true,
      _errored: false,
      error: null,
    });
    this.emit(PROVIDER_EVENTS.INITIALIZED);
  }

  public setupProviderFromInjectedProvider(injectedProvider: ISolanaWallet): SafeEventEmitterProvider {
    if (!this.state._initialized) throw new ProviderNotReadyError("Provider not initialized");
    const injectedProviderProxy = createInjectedProviderProxyMiddleware({ provider: injectedProvider });
    const engine = new JRPCEngine();
    engine.push(injectedProviderProxy);
    const provider = providerFromEngine(engine);
    this._providerProxy = createSwappableProxy<SafeEventEmitterProvider>(provider);
    return this._providerProxy;
  }
}
