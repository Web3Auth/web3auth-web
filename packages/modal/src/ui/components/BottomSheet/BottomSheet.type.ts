import { type ReactNode } from "react";

import { BorderRadiusType } from "../../interfaces";

export interface BottomSheetProps {
  isShown: boolean;
  onClose: () => void;
  children: ReactNode;
  sheetClassName?: string;
  showCloseButton?: boolean;
  borderRadiusType?: BorderRadiusType;
}
