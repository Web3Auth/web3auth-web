import { JSX } from "react";

export interface EmbedProps {
  children: JSX.Element[] | JSX.Element;
  padding?: boolean;
  shadow?: boolean;
  border?: boolean;
  showCloseIcon?: boolean;
  onClose?: () => void;
  open?: boolean;
}
