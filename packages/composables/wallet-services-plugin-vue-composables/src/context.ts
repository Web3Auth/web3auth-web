import { InjectionKey } from "vue";

import { IWalletServicesContext } from "./interfaces";

export const WalletServicesContextKey = Symbol("WalletServicesContextKey") as InjectionKey<IWalletServicesContext>;
