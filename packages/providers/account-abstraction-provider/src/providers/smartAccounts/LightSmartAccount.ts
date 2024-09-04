import { IProvider } from "@web3auth/base";
import { toLightSmartAccount, ToLightSmartAccountParameters } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { SmartAccount } from "viem/account-abstraction";

import { ISmartAccount } from "./types";

type LightSmartAccountConfig = Omit<ToLightSmartAccountParameters, "owners" | "client" | "index" | "address" | "nonceKey">;

export class LightSmartAccount implements ISmartAccount {
  private options: LightSmartAccountConfig;

  constructor(options: LightSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: IProvider; client: Client } & Pick<ToLightSmartAccountParameters, "address" | "index" | "nonceKey">
  ): Promise<SmartAccount> {
    return toLightSmartAccount({
      ...this.options,
      owner: params.owner as EIP1193Provider,
      client: params.client,
    });
  }
}
