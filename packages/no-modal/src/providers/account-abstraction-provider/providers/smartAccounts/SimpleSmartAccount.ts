import { toSimpleSmartAccount } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { entryPoint07Address, SmartAccount } from "viem/account-abstraction";

import { IProvider } from "@/core/base";

import { SMART_ACCOUNT } from "./constants";
import { ISmartAccount, SimpleSmartAccountConfig } from "./types";

export class SimpleSmartAccount implements ISmartAccount {
  readonly name: string = SMART_ACCOUNT.SIMPLE;

  public options: SimpleSmartAccountConfig;

  constructor(options?: SimpleSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(params: { owner: IProvider; client: Client }): Promise<SmartAccount> {
    return toSimpleSmartAccount({
      ...(this.options || {}),
      entryPoint: {
        address: this.options?.entryPoint?.address || entryPoint07Address,
        version: this.options?.entryPoint?.version || "0.7",
      },
      owner: params.owner as EIP1193Provider,
      client: params.client,
    });
  }
}
