import type { ReactNode } from "react";

export type SpinnerLoaderClassesKey = "spinner";

export interface SpinnerLoaderProps {
  children?: ReactNode;
  classes?: Partial<Record<SpinnerLoaderClassesKey, string>>;
  width?: number | string;
  height?: number | string;
  className?: string;
}
