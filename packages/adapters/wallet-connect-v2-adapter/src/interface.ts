import type { EngineTypes, SignClientTypes } from "@walletconnect/types";
import { BaseAdapterSettings, INetworkSwitch } from "@web3auth/base";

export interface IQRCodeModal {
  open(uri: string, cb: any, opts?: any): void;
  close(): void;
}
interface IAdapterSettings {
  walletConnectInitOptions?: SignClientTypes.Options;
  skipNetworkSwitching?: boolean;
  networkSwitchModal?: INetworkSwitch;
  qrcodeModal?: IQRCodeModal;
}
export interface WalletConnectV2AdapterOptions extends BaseAdapterSettings {
  adapterSettings?: IAdapterSettings;
  loginSettings?: EngineTypes.ConnectParams;
}
