import { BaseConnectorConfig, WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";

import type { BlockedUserConfig, ModalStatusType } from "../../interfaces";

export interface LoaderProps {
  externalWalletsConfig: Record<string, BaseConnectorConfig>;
  message?: string;
  connector: string;
  connectorName: string;
  modalStatus: ModalStatusType;
  onClose: () => void;
  isConnectAndSignAuthenticationMode: boolean;
  handleMobileVerifyConnect: (params: { connector: WALLET_CONNECTOR_TYPE }) => void;
  hideSuccessScreen?: boolean;
  blockedUserConfig?: BlockedUserConfig;
}

export type ConnectingStatusType = Pick<LoaderProps, "connectorName" | "connector">;

export type ConnectedStatusType = Pick<LoaderProps, "message">;

export type ErroredStatusType = Pick<LoaderProps, "message">;

export type AuthorizingStatusType = Pick<LoaderProps, "connector" | "externalWalletsConfig" | "handleMobileVerifyConnect">;

export type BlockedStatusType = BlockedUserConfig;
