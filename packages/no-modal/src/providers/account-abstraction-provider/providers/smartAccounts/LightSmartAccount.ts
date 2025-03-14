import { type ISmartAccount } from "@toruslabs/ethereum-controllers";
import { toLightSmartAccount, type ToLightSmartAccountParameters } from "permissionless/accounts";
import type { Client, EIP1193Provider } from "viem";
import { entryPoint07Address, type SmartAccount } from "viem/account-abstraction";

export type LightSmartAccountConfig = Omit<ToLightSmartAccountParameters, "owner" | "client" | "index" | "address" | "nonceKey">;

export class LightSmartAccount implements ISmartAccount {
  private options: LightSmartAccountConfig;

  constructor(options?: LightSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: EIP1193Provider; client: Client } & Pick<ToLightSmartAccountParameters, "address" | "index" | "nonceKey">
  ): Promise<SmartAccount> {
    return toLightSmartAccount({
      ...(this.options || {}),
      entryPoint: {
        address: this.options?.entryPoint?.address || entryPoint07Address,
        version: this.options?.entryPoint?.version || "0.7",
      },
      version: this.options?.version || "2.0.0",
      owner: params.owner,
      client: params.client,
    });
  }
}
