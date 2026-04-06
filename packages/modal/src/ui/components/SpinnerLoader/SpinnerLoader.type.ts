import type { ReactNode } from "react";

export type SpinnerLoaderClassesKey = "spinner";

export interface SpinnerLoaderProps {
  children?: ReactNode;
  /** Override the primary color used for the spinner ring gradient. */
  primaryColor?: string;
  classes?: Partial<Record<SpinnerLoaderClassesKey, string>>;
  width?: number | string;
  height?: number | string;
  className?: string;
}
