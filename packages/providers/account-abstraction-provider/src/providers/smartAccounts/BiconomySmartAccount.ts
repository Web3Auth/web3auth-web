import { IProvider } from "@web3auth/base";
import { toBiconomySmartAccount, ToBiconomySmartAccountParameters } from "permissionless/accounts";
import { Client, EIP1193Provider } from "viem";
import { SmartAccount } from "viem/account-abstraction";

import { ISmartAccount } from "./types";

type BiconomySmartAccountConfig = Pick<ToBiconomySmartAccountParameters, "entryPoint" | "ecdsaModuleAddress" | "factoryAddress">;

export class BiconomySmartAccount implements ISmartAccount {
  private options: BiconomySmartAccountConfig;

  constructor(options: BiconomySmartAccountConfig) {
    this.options = options;
  }

  async getSmartAccount(
    params: { owner: IProvider; client: Client } & Pick<ToBiconomySmartAccountParameters, "index" | "nonceKey" | "address">
  ): Promise<SmartAccount> {
    return toBiconomySmartAccount({
      ...this.options,
      ...params,
      owners: [params.owner as EIP1193Provider],
      client: params.client,
    });
  }
}
