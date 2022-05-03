import type { IWalletConnectOptions } from "@walletconnect/types";
import { CustomChainConfig } from "@web3auth/base";

interface IAdapterSettings extends IWalletConnectOptions {
  skipNetworkSwitching?: boolean;
}
export interface WalletConnectV1AdapterOptions {
  adapterSettings?: IAdapterSettings;
  chainConfig?: CustomChainConfig;
}
