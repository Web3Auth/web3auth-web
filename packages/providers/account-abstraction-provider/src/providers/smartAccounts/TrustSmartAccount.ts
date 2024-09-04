import { IProvider } from "@web3auth/base";
import { toTrustSmartAccount } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { SmartAccount } from "viem/account-abstraction";

import { ISmartAccount } from "./types";

type TrustSmartAccountParameters = Parameters<typeof toTrustSmartAccount>[0]; // use type of function so we don't need to pass in generic to parameter type

type TrustSmartAccountConfig = Omit<TrustSmartAccountParameters, "owners" | "client" | "address" | "nonceKey" | "index">;

export class TrustSmartAccount implements ISmartAccount {
  private options: TrustSmartAccountConfig;

  constructor(options: TrustSmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: IProvider; client: Client } & Pick<TrustSmartAccountParameters, "address" | "nonceKey" | "index">
  ): Promise<SmartAccount> {
    return toTrustSmartAccount({
      ...this.options,
      ...params,
      owner: params.owner as EIP1193Provider,
      client: params.client,
    });
  }
}
