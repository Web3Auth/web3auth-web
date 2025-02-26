import { IProvider } from "@web3auth/base";
import { toEcdsaKernelSmartAccount } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { SmartAccount } from "viem/account-abstraction";

import { SMART_ACCOUNT } from "./constants";
import { ISmartAccount } from "./types";

type KernelSmartAccountParameters = Parameters<typeof toEcdsaKernelSmartAccount>[0]; // use type of function so we don't need to pass in generic to parameter type

type KernelSmartAccountConfig = Omit<KernelSmartAccountParameters, "owners" | "client" | "address" | "nonceKey" | "index">;

export class KernelSmartAccount implements ISmartAccount {
  readonly name: string = SMART_ACCOUNT.KERNEL;

  private options: KernelSmartAccountConfig;

  constructor(options?: KernelSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: IProvider; client: Client } & Pick<KernelSmartAccountParameters, "address" | "nonceKey" | "index">
  ): Promise<SmartAccount> {
    return toEcdsaKernelSmartAccount({
      ...(this.options || {}),
      ...params,
      owners: [params.owner as EIP1193Provider],
      client: params.client,
    });
  }
}
