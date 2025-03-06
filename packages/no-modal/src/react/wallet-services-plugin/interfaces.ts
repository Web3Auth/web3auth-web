import type { IBaseWalletServicesHookContext } from "@/core/base";
import type { WalletServicesPluginType } from "@/core/wallet-services-plugin";

export interface IWalletServicesContext extends IBaseWalletServicesHookContext {
  plugin: WalletServicesPluginType | null;
}
