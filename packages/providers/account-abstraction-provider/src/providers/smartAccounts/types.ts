import { IProvider } from "@web3auth/base";
import { Client } from "viem";
import { SmartAccount } from "viem/account-abstraction";

export interface ISmartAccount {
  getSmartAccount(params: { owner: IProvider; client: Client }): Promise<SmartAccount>;
}
