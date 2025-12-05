import { UIConfig } from "../../interfaces";

export interface BottomSheetProps {
  isShown: boolean;
  uiConfig: UIConfig;
  onClose: () => void;
  children: React.ReactNode;
  sheetClassName?: string;
  showCloseButton?: boolean;
}
