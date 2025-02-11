import { toSafeSmartAccount } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { entryPoint07Address, SmartAccount } from "viem/account-abstraction";

import { IProvider } from "@/core/base";

import { SMART_ACCOUNT } from "./constants";
import { ISmartAccount, SafeSmartAccountConfig, SafeSmartAccountParameters } from "./types";

export class SafeSmartAccount implements ISmartAccount {
  readonly name: string = SMART_ACCOUNT.SAFE;

  public options: SafeSmartAccountConfig;

  constructor(options?: SafeSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: IProvider; client: Client } & Pick<
      SafeSmartAccountParameters,
      "address" | "nonceKey" | "saltNonce" | "validUntil" | "validAfter"
    >
  ): Promise<SmartAccount> {
    return toSafeSmartAccount({
      ...(this.options || {}),
      entryPoint: {
        address: this.options?.entryPoint?.address || entryPoint07Address,
        version: this.options?.entryPoint?.version || "0.7",
      },
      version: this.options?.version || "1.4.1",
      ...params,
      owners: [params.owner as EIP1193Provider],
      client: params.client,
    });
  }
}
