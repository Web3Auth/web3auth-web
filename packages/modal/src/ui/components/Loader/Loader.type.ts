import type { ModalStatusType } from "../../interfaces";

export interface LoaderProps {
  message?: string;
  appLogo?: string;
  connector: string;
  connectorName: string;
  modalStatus: ModalStatusType;
  onClose: () => void;
}

export type ConnectingStatusType = Pick<LoaderProps, "connectorName" | "appLogo" | "connector">;

export type ConnectedStatusType = Pick<LoaderProps, "message">;

export type ErroredStatusType = Pick<LoaderProps, "message">;
