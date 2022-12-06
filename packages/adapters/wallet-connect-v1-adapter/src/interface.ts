import type { IWalletConnectOptions } from "@walletconnect/types";
import { BaseAdapterSettings, INetworkSwitch } from "@web3auth/base";

interface IAdapterSettings extends IWalletConnectOptions {
  skipNetworkSwitching?: boolean;
  networkSwitchModal?: INetworkSwitch;
}
export interface WalletConnectV1AdapterOptions extends BaseAdapterSettings {
  adapterSettings?: IAdapterSettings;
}
