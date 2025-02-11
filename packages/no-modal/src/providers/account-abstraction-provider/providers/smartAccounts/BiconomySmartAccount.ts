import { toBiconomySmartAccount, ToBiconomySmartAccountParameters } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { entryPoint06Address, SmartAccount } from "viem/account-abstraction";

import { IProvider } from "@/core/base";

import { SMART_ACCOUNT } from "./constants";
import { BiconomySmartAccountConfig, ISmartAccount } from "./types";

export class BiconomySmartAccount implements ISmartAccount {
  readonly name: string = SMART_ACCOUNT.BICONOMY;

  public options: BiconomySmartAccountConfig;

  constructor(options?: BiconomySmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: IProvider; client: Client } & Pick<ToBiconomySmartAccountParameters, "index" | "nonceKey" | "address">
  ): Promise<SmartAccount> {
    return toBiconomySmartAccount({
      ...(this.options || {}),
      entryPoint: {
        address: this.options?.entryPoint?.address || entryPoint06Address,
        version: this.options?.entryPoint?.version || "0.6",
      },
      ...params,
      owners: [params.owner as EIP1193Provider],
      client: params.client,
    });
  }
}
