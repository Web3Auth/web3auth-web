import type { EngineTypes, SignClientTypes } from "@walletconnect/types";
import { BaseAdapterSettings } from "@web3auth/base";

export interface OpenOptions {
  uri: string;
  chains?: string[];
}

export interface IQRCodeModal {
  openModal: (options?: OpenOptions) => Promise<void>;

  closeModal: () => void;
}

export interface IAdapterSettings {
  walletConnectInitOptions?: SignClientTypes.Options;
  qrcodeModal?: IQRCodeModal;
}

export interface WalletConnectV2AdapterOptions extends BaseAdapterSettings {
  adapterSettings?: IAdapterSettings;
  loginSettings?: EngineTypes.ConnectParams;
}
