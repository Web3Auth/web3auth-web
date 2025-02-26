import type { IBaseWalletServicesHookContext } from "@web3auth/base";
import type { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";

export interface IWalletServicesContext extends IBaseWalletServicesHookContext {
  plugin: WalletServicesPlugin | null;
}
