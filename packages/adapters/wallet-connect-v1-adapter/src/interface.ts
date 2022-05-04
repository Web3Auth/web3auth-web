import type { IWalletConnectOptions } from "@walletconnect/types";
import { CustomChainConfig } from "@web3auth/base";
import type { INetworkSwitch } from "@web3auth/ui";

interface IAdapterSettings extends IWalletConnectOptions {
  skipNetworkSwitching?: boolean;
  networkSwitchModal?: INetworkSwitch;
}
export interface WalletConnectV1AdapterOptions {
  adapterSettings?: IAdapterSettings;
  chainConfig?: CustomChainConfig;
}
