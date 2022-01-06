import { BaseConfig, BaseController, BaseState } from "@toruslabs/base-controllers";
import { CustomChainConfig, SafeEventEmitterProvider, WalletInitializationError } from "@web3auth/base";

import { IBaseProvider } from "./IBaseProvider";

export interface BaseProviderState extends BaseState {
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
      chainId: "loading",
    } as S;
    this.defaultConfig = {
      chainConfig: config.chainConfig,
    } as C;
    super.initialize();
  }

  abstract setupProvider(provider: T): Promise<SafeEventEmitterProvider>;

  protected abstract lookupNetwork(provider?: T): Promise<string | void>;
}
