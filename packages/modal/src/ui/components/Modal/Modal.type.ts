import { JSX } from "react";

export type ModalPlacement = "center" | "top-center" | "bottom-center" | "left" | "right";

export interface ModalProps {
  children: JSX.Element[] | JSX.Element;
  open: boolean;
  onClose?: () => void;
  placement?: ModalPlacement;
  padding?: boolean;
  shadow?: boolean;
  border?: boolean;
  showCloseIcon?: boolean;
}
