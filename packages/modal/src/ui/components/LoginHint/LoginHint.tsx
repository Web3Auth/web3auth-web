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
      className="w3a--relative"
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
            "w3a--absolute w3a--z-[45] w3a--shadow-2xl w3a--rounded-lg w3a--bottom-[100%] w3a--left-[50%] w3a--w-max w3a--text-xs w3a--px-[6px] w3a--py-[3px]",
            isDark ? "w3a--bg-app-white w3a--text-app-gray-900" : "w3a--bg-app-gray-800 w3a--text-app-gray-100"
          )}
        >
          {content}
          <div className="w3a--absolute" style={triangleStyle}></div>
        </div>
      )}
    </div>
  );
};

export default LoginHint;
