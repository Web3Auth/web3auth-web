import { IWalletStandardProviderHandler } from "../../interface";
import { IProviderHandlers } from "../../rpc";
import { BaseInjectedProvider } from "./base/baseInjectedProvider";
import { getBaseProviderHandlers } from "./base/providerHandlers";

export class WalletStandardProvider extends BaseInjectedProvider<IWalletStandardProviderHandler> {
  protected getProviderHandlers(injectedProvider: IWalletStandardProviderHandler): IProviderHandlers {
    return getBaseProviderHandlers(injectedProvider);
  }
}
