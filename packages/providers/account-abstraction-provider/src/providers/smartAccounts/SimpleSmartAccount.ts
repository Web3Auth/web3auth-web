import { IProvider } from "@web3auth/base";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { entryPoint07Address, SmartAccount } from "viem/account-abstraction";

import { ISmartAccount } from "./types";

type SimpleSmartAccountParameters = Parameters<typeof toSimpleSmartAccount>[0]; // use type of function so we don't need to pass in generic to parameter type

type SimpleSmartAccountConfig = Omit<SimpleSmartAccountParameters, "owner" | "client">;

export class SimpleSmartAccount implements ISmartAccount {
  private options: SimpleSmartAccountConfig;

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
