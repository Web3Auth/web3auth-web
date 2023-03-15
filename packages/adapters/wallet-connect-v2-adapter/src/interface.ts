import type { EngineTypes, SignClientTypes } from "@walletconnect/types";
import { BaseAdapterSettings } from "@web3auth/base";

export interface IQRCodeModal {
  open(uri: string, cb: any, opts?: any): void;
  close(): void;
}

export interface IAdapterSettings {
  walletConnectInitOptions?: SignClientTypes.Options;
  qrcodeModal?: IQRCodeModal;
}

export interface WalletConnectV2AdapterOptions extends BaseAdapterSettings {
  adapterSettings?: IAdapterSettings;
  loginSettings?: EngineTypes.ConnectParams;
}
