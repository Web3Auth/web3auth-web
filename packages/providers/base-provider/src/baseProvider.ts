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

export abstract class BaseProvider<C extends BaseProviderConfig, S extends BaseProviderState, T>
  extends BaseController<C, S>
  implements IBaseProvider<T>
{
  constructor({ config, state }: { config?: C; state?: S }) {
    super({ config, state });
    if (!config.chainConfig) throw WalletInitializationError.invalidProviderConfigError("Please provide chainConfig");
    this.defaultState = {
      _initialized: false,
      _errored: false,
      error: null,
      chainId: "loading",
    } as S;
    this.defaultConfig = {
      chainConfig: config.chainConfig,
    } as C;
  }

  public init(provider?: T): void {
    this.lookupNetwork(provider)
      .then(() => {
        this.update({
          _initialized: true,
          _errored: false,
          error: null,
        } as S);
        this.emit(PROVIDER_EVENTS.INITIALIZED);
        return true;
      })
      .catch((error) => {
        this.update({
          _errored: true,
          error,
        } as S);
        this.emit(PROVIDER_EVENTS.ERRORED, { error });
      });
  }

  abstract setupProvider(provider: T): SafeEventEmitterProvider;

  protected abstract lookupNetwork(provider?: T): Promise<string | void>;
}
