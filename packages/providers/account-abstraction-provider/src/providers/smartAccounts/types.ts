import { IProvider } from "@web3auth/base";
import { PublicClient } from "viem";
import { SmartAccount } from "viem/account-abstraction";

export interface ISmartAccount {
  getSmartAccount(params: { owner: IProvider; client: PublicClient }): Promise<SmartAccount>;
}
