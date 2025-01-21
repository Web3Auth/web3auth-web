import type { IBaseWalletServicesHookContext } from "@/core/base";
import type { WalletServicesPlugin } from "@/core/wallet-services-plugin";

export interface IWalletServicesContext extends IBaseWalletServicesHookContext {
  plugin: WalletServicesPlugin | null;
}
