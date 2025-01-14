import { IBaseSmartAccount, IProvider } from "@web3auth/base";
import {
  ToBiconomySmartAccountParameters,
  toEcdsaKernelSmartAccount,
  ToLightSmartAccountParameters,
  ToNexusSmartAccountParameters,
  toSafeSmartAccount,
  toSimpleSmartAccount,
  toTrustSmartAccount,
} from "permissionless/accounts";
import { Client } from "viem";
import { SmartAccount } from "viem/account-abstraction";

export type BiconomySmartAccountConfig = Pick<ToBiconomySmartAccountParameters, "entryPoint" | "ecdsaModuleAddress" | "factoryAddress">;

export type KernelSmartAccountParameters = Parameters<typeof toEcdsaKernelSmartAccount>[0]; // use type of function so we don't need to pass in generic to parameter type

export type KernelSmartAccountConfig = Omit<KernelSmartAccountParameters, "owners" | "client" | "address" | "nonceKey" | "index">;

export type LightSmartAccountConfig = Omit<ToLightSmartAccountParameters, "owner" | "client" | "index" | "address" | "nonceKey">;

export type NexusSmartAccountConfig = Omit<ToNexusSmartAccountParameters, "owners" | "client" | "index" | "address">;

export type SafeSmartAccountParameters = Parameters<typeof toSafeSmartAccount>[0]; // use type of function so we don't need to pass in generic to parameter type

export type SafeSmartAccountConfig = Omit<
  SafeSmartAccountParameters,
  "owners" | "client" | "address" | "nonceKey" | "saltNonce" | "validUntil" | "validAfter"
>;

export type SimpleSmartAccountParameters = Parameters<typeof toSimpleSmartAccount>[0]; // use type of function so we don't need to pass in generic to parameter type

export type SimpleSmartAccountConfig = Omit<SimpleSmartAccountParameters, "owner" | "client">;

export type TrustSmartAccountParameters = Parameters<typeof toTrustSmartAccount>[0]; // use type of function so we don't need to pass in generic to parameter type

export type TrustSmartAccountConfig = Omit<TrustSmartAccountParameters, "owner" | "client" | "address" | "nonceKey" | "index">;

export interface ISmartAccount extends IBaseSmartAccount {
  options:
    | BiconomySmartAccountConfig
    | KernelSmartAccountConfig
    | NexusSmartAccountConfig
    | SafeSmartAccountConfig
    | TrustSmartAccountConfig
    | LightSmartAccountConfig
    | SimpleSmartAccountConfig;
  getSmartAccount(params: { owner: IProvider; client: Client }): Promise<SmartAccount>;
}
