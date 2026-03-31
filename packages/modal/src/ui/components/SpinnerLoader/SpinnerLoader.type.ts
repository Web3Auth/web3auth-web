import type { ReactNode } from "react";

export type SpinnerLoaderClassesKey = "spinner" | "logo";

export interface SpinnerLoaderProps {
  logoLight?: string;
  logoDark?: string;
  showLogo?: boolean;
  children?: ReactNode;
  /** Override the primary color used for the spinner ring gradient. */
  primaryColor?: string;
  classes?: Partial<Record<SpinnerLoaderClassesKey, string>>;
  width?: number | string;
  height?: number | string;
  className?: string;
}
