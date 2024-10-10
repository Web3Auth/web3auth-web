import { IProvider } from "@web3auth/base";
import { toLightSmartAccount, ToLightSmartAccountParameters } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { entryPoint07Address, SmartAccount } from "viem/account-abstraction";

import { SMART_ACCOUNT } from "./constants";
import { ISmartAccount } from "./types";

type LightSmartAccountConfig = Omit<ToLightSmartAccountParameters, "owner" | "client" | "index" | "address" | "nonceKey">;

export class LightSmartAccount implements ISmartAccount {
  readonly name: string = SMART_ACCOUNT.LIGHT;

  private options: LightSmartAccountConfig;

  constructor(options?: LightSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: IProvider; client: Client } & Pick<ToLightSmartAccountParameters, "address" | "index" | "nonceKey">
  ): Promise<SmartAccount> {
    return toLightSmartAccount({
      ...(this.options || {}),
      entryPoint: {
        address: this.options?.entryPoint?.address || entryPoint07Address,
        version: this.options?.entryPoint?.version || "0.7",
      },
      version: this.options?.version || "2.0.0",
      owner: params.owner as EIP1193Provider,
      client: params.client,
    });
  }
}
