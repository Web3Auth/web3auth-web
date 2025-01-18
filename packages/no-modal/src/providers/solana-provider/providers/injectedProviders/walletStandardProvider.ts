import { IWalletStandardProviderHandler } from "../../interface";
import { ISolanaProviderHandlers } from "../../rpc";
import { BaseInjectedProvider } from "./base/baseInjectedProvider";
import { getBaseProviderHandlers } from "./base/providerHandlers";

export class WalletStandardProvider extends BaseInjectedProvider<IWalletStandardProviderHandler> {
  protected getProviderHandlers(injectedProvider: IWalletStandardProviderHandler): ISolanaProviderHandlers {
    return getBaseProviderHandlers(injectedProvider);
  }
}
