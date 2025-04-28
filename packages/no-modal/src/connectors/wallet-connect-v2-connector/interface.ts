import type { EngineTypes, SignClientTypes } from "@walletconnect/types";

import { BaseConnectorSettings } from "../../base";

export interface OpenOptions {
  uri: string;
  chains?: string[];
}

export interface IQRCodeModal {
  openModal: (options?: OpenOptions) => Promise<void>;

  closeModal: () => void;
}

export interface IConnectorSettings {
  walletConnectInitOptions?: SignClientTypes.Options;
  qrcodeModal?: IQRCodeModal;
}

export interface WalletConnectV2ConnectorOptions extends BaseConnectorSettings {
  connectorSettings?: IConnectorSettings;
  loginSettings?: EngineTypes.ConnectParams;
}
