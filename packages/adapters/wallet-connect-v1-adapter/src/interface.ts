import type { IWalletConnectOptions } from "@walletconnect/types";
import { CustomChainConfig } from "@web3auth/base";

export interface WalletConnectV1AdapterOptions {
  adapterSettings?: IWalletConnectOptions;
  chainConfig?: CustomChainConfig;
}
