import { InjectionKey } from "vue";

import { IWalletServicesInnerContext } from "../interfaces";

export const WalletServicesContextKey = Symbol("WalletServicesContextKey") as InjectionKey<IWalletServicesInnerContext>;
