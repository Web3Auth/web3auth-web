import type { ReactNode } from "react";

export interface CircularLoaderProps {
  width?: number | string;
  height?: number | string;
  thickness?: number;
  showChildren?: boolean;
  children?: ReactNode;
  className?: string;
  trackColor?: string;
  /** Size of the colored arc in degrees (0-360). Default: 40 */
  arcSizeDeg?: number;
  /** Two colors for the orange arc gradient [start, end]. */
  arcColors?: [string, string];
  /**
   * CSS color stops for conic-gradient. Example:
   * "conic-gradient(#f97316, #fdba74 320deg, transparent 320deg)"
   */
  gradient?: string;
}
