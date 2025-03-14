import { type ISmartAccount } from "@toruslabs/ethereum-controllers";
import { toSimpleSmartAccount } from "permissionless/accounts";
import type { Client, EIP1193Provider } from "viem";
import { entryPoint07Address, type SmartAccount } from "viem/account-abstraction";

type SimpleSmartAccountParameters = Parameters<typeof toSimpleSmartAccount>[0]; // use type of function so we don't need to pass in generic to parameter type

export type SimpleSmartAccountConfig = Omit<SimpleSmartAccountParameters, "owner" | "client">;

export class SimpleSmartAccount implements ISmartAccount {
  private options: SimpleSmartAccountConfig;

  constructor(options?: SimpleSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(params: { owner: EIP1193Provider; client: Client }): Promise<SmartAccount> {
    return toSimpleSmartAccount({
      ...(this.options || {}),
      entryPoint: {
        address: this.options?.entryPoint?.address || entryPoint07Address,
        version: this.options?.entryPoint?.version || "0.7",
      },
      owner: params.owner,
      client: params.client,
    });
  }
}
