import type { ReactNode } from "react";

export type SpinnerLoaderClassesKey = "spinner" | "logo";

export interface SpinnerLoaderProps {
  logoLight?: string;
  logoDark?: string;
  showLogo?: boolean;
  children?: ReactNode;
  classes?: Partial<Record<SpinnerLoaderClassesKey, string>>;
  width?: number | string;
  height?: number | string;
  className?: string;
}
