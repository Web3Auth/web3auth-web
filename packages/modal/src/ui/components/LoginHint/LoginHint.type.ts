import { type ReactNode } from "react";

export interface LoginHintProps {
  children: ReactNode;
  content: string;
  isDark?: boolean;
  hideHint?: boolean;
}
