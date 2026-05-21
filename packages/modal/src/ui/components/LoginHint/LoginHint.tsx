import { useMemo, useState } from "react";

import { cn } from "../../utils";
import { LoginHintProps } from "./LoginHint.type";

const LoginHint = ({ children, content, isDark = false, hideHint = false }: LoginHintProps) => {
  const [showPopover, setShowPopover] = useState(false);

  const handleMouseEnter = () => {
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    setShowPopover(false);
  };

  const triangleStyle = useMemo(() => {
    const triangleSize = "8px"; // Customize the size of the triangle
    const triangleColor = isDark ? "#ffffff" : "#1f2a37"; // Customize the color of the triangle
    return {
      borderTop: `${triangleSize} solid transparent`,
      borderRight: "none",
      borderBottom: `${triangleSize} solid transparent`,
      borderLeft: `${triangleSize} solid ${triangleColor}`,
      left: "0%",
      top: `calc(100% - ${triangleSize})`,
    };
  }, [isDark]);

  return (
    <div
      className="wta:relative"
      aria-hidden
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={handleMouseLeave}
    >
      {children}
      {showPopover && !hideHint && (
        <div
          data-popover
          role="tooltip"
          className={cn(
            "wta:absolute wta:z-[45] wta:shadow-2xl wta:rounded-lg wta:bottom-[100%] wta:left-[50%] wta:w-max wta:text-xs wta:px-[6px] wta:py-[3px]",
            isDark ? "wta:bg-app-white wta:text-app-gray-900" : "wta:bg-app-gray-800 wta:text-app-gray-100"
          )}
        >
          {content}
          <div className="wta:absolute" style={triangleStyle}></div>
        </div>
      )}
    </div>
  );
};

export default LoginHint;
