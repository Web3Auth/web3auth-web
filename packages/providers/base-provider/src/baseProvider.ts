import { BaseConfig, BaseController, BaseState, SafeEventEmitterProvider } from "@toruslabs/base-controllers";
import { CustomChainConfig, PROVIDER_EVENTS, WalletInitializationError } from "@web3auth/base";

import { IBaseProvider } from "./IBaseProvider";

export interface BaseProviderState extends BaseState {
  _initialized: boolean;
  _errored: boolean;
  error: Error | null;
  chainId: string;
}

export interface BaseProviderConfig extends BaseConfig {
  chainConfig: Partial<CustomChainConfig>;
}

export abstract class BaseProvider<T> extends BaseController<BaseProviderConfig, BaseProviderState> implements IBaseProvider<T> {
  constructor({ config, state }: { config?: BaseProviderConfig; state?: BaseProviderState }) {
    super({ config, state });
    if (!config.chainConfig) throw WalletInitializationError.invalidProviderConfigError("Please provide chainConfig");
    this.defaultState = {
      _initialized: false,
      _errored: false,
      error: null,
      chainId: "loading",
    };
    this.defaultConfig = {
      chainConfig: config.chainConfig,
    };
  }

  public init(provider?: T): void {
    this.lookupNetwork(provider)
      .then(() => {
        this.update({
          _initialized: true,
          _errored: false,
          error: null,
        });
        this.emit(PROVIDER_EVENTS.INITIALIZED);
        return true;
      })
      .catch((error) => {
        this.update({
          _errored: true,
          error,
        });
        this.emit(PROVIDER_EVENTS.ERRORED, { error });
      });
  }

  abstract setupProvider(provider: T): SafeEventEmitterProvider;

  protected abstract lookupNetwork(provider?: T): Promise<string>;
}
