import { cn } from "../../utils";
import type { CircularLoaderProps } from "./CircularLoader.type";

function toSize(value?: number | string, fallback = 160): number | string {
  return value ?? fallback;
}

const CircularLoader = (props: CircularLoaderProps) => {
  const {
    width,
    height,
    thickness = 12,
    className = "",
    children,
    showChildren = true,
    trackColor = "rgba(226, 232, 240, 1)", // Tailwind slate-200 equivalent
    gradient,
    arcSizeDeg = 36,
    arcColors,
  } = props;

  const w = toSize(width, 160);
  const h = toSize(height, 160);
  const ringMask = `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`;

  function hexToRgba(hex: string, alpha: number) {
    const normalized = hex.replace("#", "");
    const full =
      normalized.length === 3
        ? normalized
            .split("")
            .map((c) => c + c)
            .join("")
        : normalized;
    const r = parseInt(full.substring(0, 2), 16);
    const g = parseInt(full.substring(2, 4), 16);
    const b = parseInt(full.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function withAlpha(color: string, alpha: number) {
    if (!color) return color;
    const c = color.trim().toLowerCase();
    if (c.startsWith("#")) return hexToRgba(c, alpha);
    if (c.startsWith("rgba(")) return color;
    if (c.startsWith("rgb(")) {
      const nums = c.slice(4, -1);
      return `rgba(${nums}, ${alpha})`;
    }
    // Fallback: return the same color (alpha may be ignored by browser)
    return color;
  }

  const arcColorGradient =
    gradient ||
    (arcColors
      ? `radial-gradient(210.91% 85.29% at 14.56% 18.67%, ${withAlpha(arcColors[0], 0)} 9.5%, ${arcColors[1]} 41.82%, ${arcColors[1]} 64.83%, ${withAlpha(
          arcColors[0],
          0.44
        )} 100%)`
      : "radial-gradient(210.91% 85.29% at 14.56% 18.67%, rgba(255, 98, 58, 0.00) 9.5%, #FF623A 41.82%, #FF623A 64.83%, rgba(255, 98, 58, 0.44) 100%)");
  const wedgeMask = `conic-gradient(#000 0deg ${arcSizeDeg}deg, transparent ${arcSizeDeg}deg 360deg)`;

  return (
    <div className={cn("w3a--relative w3a--inline-flex w3a--items-center w3a--justify-center", className)} style={{ width: w, height: h }}>
      <div
        className="w3a--absolute w3a--inset-0 w3a--rounded-full"
        style={{
          background: trackColor,
          WebkitMaskImage: ringMask,
          maskImage: ringMask,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />

      <div
        className="w3a--absolute w3a--inset-0 w3a--animate-spin"
        style={{
          WebkitMaskImage: wedgeMask,
          maskImage: wedgeMask,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      >
        <div
          className="w3a--absolute w3a--inset-0 w3a--rounded-full"
          style={{
            background: arcColorGradient,
            WebkitMaskImage: ringMask,
            maskImage: ringMask,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        />
      </div>

      {showChildren && children ? <div className="w3a--relative">{children}</div> : null}
    </div>
  );
};

export default CircularLoader;
