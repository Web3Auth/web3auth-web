import { toTrustSmartAccount } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { entryPoint06Address, SmartAccount } from "viem/account-abstraction";

import { IProvider } from "@/core/base";

import { SMART_ACCOUNT } from "./constants";
import { ISmartAccount, TrustSmartAccountConfig, TrustSmartAccountParameters } from "./types";

export class TrustSmartAccount implements ISmartAccount {
  readonly name: string = SMART_ACCOUNT.TRUST;

  public options: TrustSmartAccountConfig;

  constructor(options?: TrustSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: IProvider; client: Client } & Pick<TrustSmartAccountParameters, "address" | "nonceKey" | "index">
  ): Promise<SmartAccount> {
    return toTrustSmartAccount({
      ...(this.options || {}),
      entryPoint: {
        address: this.options?.entryPoint?.address || entryPoint06Address,
        version: this.options?.entryPoint?.version || "0.6",
      },
      ...params,
      owner: params.owner as EIP1193Provider,
      client: params.client,
    });
  }
}
