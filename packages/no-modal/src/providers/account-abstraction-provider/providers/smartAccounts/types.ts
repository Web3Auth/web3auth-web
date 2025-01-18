import { Client } from "viem";
import { SmartAccount } from "viem/account-abstraction";

import { IBaseSmartAccount, IProvider } from "@/core/base";

export interface ISmartAccount extends IBaseSmartAccount {
  getSmartAccount(params: { owner: IProvider; client: Client }): Promise<SmartAccount>;
}
