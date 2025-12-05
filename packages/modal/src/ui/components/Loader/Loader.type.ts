import { BaseConnectorConfig, WALLET_CONNECTOR_TYPE, WalletRegistry } from "@web3auth/no-modal";

import type { ModalStatusType } from "../../interfaces";

export interface LoaderProps {
  externalWalletsConfig: Record<string, BaseConnectorConfig>;
  walletRegistry?: WalletRegistry;
  message?: string;
  appLogo?: string;
  connector: string;
  connectorName: string;
  modalStatus: ModalStatusType;
  onClose: () => void;
  isConnectAndSignAuthenticationMode: boolean;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
}

export type ConnectingStatusType = Pick<LoaderProps, "connectorName" | "appLogo" | "connector">;

export type ConnectedStatusType = Pick<LoaderProps, "message">;

export type ErroredStatusType = Pick<LoaderProps, "message">;

export type AuthorizingStatusType = Pick<LoaderProps, "connector" | "externalWalletsConfig" | "walletRegistry" | "handleMobileVerifyConnect">;
