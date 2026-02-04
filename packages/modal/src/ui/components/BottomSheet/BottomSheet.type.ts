import { BorderRadiusType } from "../../interfaces";

export interface BottomSheetProps {
  isShown: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetClassName?: string;
  showCloseButton?: boolean;
  borderRadiusType?: BorderRadiusType;
}
