// import { IProvider } from "@web3auth/base";
// import { Client, LocalAccount } from "viem";
// import { SmartAccount, toCoinbaseSmartAccount, ToCoinbaseSmartAccountParameters } from "viem/account-abstraction";

// import { ISmartAccount } from "./types";

// export class CoinBaseSmartAccount implements ISmartAccount {
//   async getSmartAccount(
//     params: { owner: IProvider; client: Client } & Pick<ToCoinbaseSmartAccountParameters, "address" | "nonce">
//   ): Promise<SmartAccount> {
//     return toCoinbaseSmartAccount({
//       ...params,
//       owners: [params.owner as LocalAccount],
//       client: params.client,
//     });
//   }
// }
