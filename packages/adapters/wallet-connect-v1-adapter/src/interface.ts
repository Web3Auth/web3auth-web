import type { IWalletConnectProviderOptions } from "@walletconnect/types";
import { CustomChainConfig } from "@web3auth/base";

export interface WalletConnectV1AdapterOptions {
  adapterSettings?: IWalletConnectProviderOptions;
  chainConfig?: CustomChainConfig;
}
