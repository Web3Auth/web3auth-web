import { toEcdsaKernelSmartAccount } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { SmartAccount } from "viem/account-abstraction";

import { IProvider } from "@/core/base";

import { SMART_ACCOUNT } from "./constants";
import { ISmartAccount, KernelSmartAccountConfig, KernelSmartAccountParameters } from "./types";

export class KernelSmartAccount implements ISmartAccount {
  readonly name: string = SMART_ACCOUNT.KERNEL;

  public options: KernelSmartAccountConfig;

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
