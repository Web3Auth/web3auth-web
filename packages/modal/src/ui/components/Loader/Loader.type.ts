import { BaseConnectorConfig } from "@web3auth/no-modal";

import type { ModalStatusType } from "../../interfaces";

export interface LoaderProps {
  externalWalletsConfig: Record<string, BaseConnectorConfig>;
  message?: string;
  appLogo?: string;
  connector: string;
  connectorName: string;
  modalStatus: ModalStatusType;
  onClose: () => void;
  isConnectAndSignAuthenticationMode: boolean;
}

export type ConnectingStatusType = Pick<LoaderProps, "connectorName" | "appLogo" | "connector">;

export type ConnectedStatusType = Pick<LoaderProps, "message">;

export type ErroredStatusType = Pick<LoaderProps, "message">;

export type AuthorizingStatusType = Pick<LoaderProps, "connector" | "externalWalletsConfig">;
