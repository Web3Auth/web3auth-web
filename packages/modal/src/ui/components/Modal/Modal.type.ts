import { JSX } from "react";

import { BorderRadiusType } from "../../interfaces";

export type ModalPlacement = "center" | "top-center" | "bottom-center" | "left" | "right";

export interface ModalProps {
  children: JSX.Element[] | JSX.Element;
  open: boolean;
  placement?: ModalPlacement;
  padding?: boolean;
  shadow?: boolean;
  border?: boolean;
  showCloseIcon?: boolean;
  onClose?: () => void;
  borderRadius?: BorderRadiusType;
}
