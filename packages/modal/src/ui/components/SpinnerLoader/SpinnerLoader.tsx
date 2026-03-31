import "./SpinnerLoader.css";

import { cn } from "../../utils";
import type { SpinnerLoaderProps } from "./SpinnerLoader.type";

const SpinnerLoader = (props: SpinnerLoaderProps) => {
  const { children, classes, width = 60, height = 60, className } = props;

  return (
    <div className={cn("w3a--spinner-loader", className)} style={{ width, height }}>
      <div className={cn("w3a--spinner-loader-ring w3a--animate-spin", classes?.spinner)} />

      {children && <div className="w3a--spinner-loader-image">{children}</div>}
    </div>
  );
};

export default SpinnerLoader;
