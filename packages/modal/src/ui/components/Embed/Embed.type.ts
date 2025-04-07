import type { JSX } from "react";

import { BorderRadiusType } from "../../interfaces";

export interface EmbedProps {
  children: JSX.Element[] | JSX.Element;
  padding?: boolean;
  shadow?: boolean;
  border?: boolean;
  showCloseIcon?: boolean;
  open?: boolean;
  onClose?: () => void;
  borderRadius?: BorderRadiusType;
}
