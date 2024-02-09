import "./styles.css";

import React, { CSSProperties, memo } from "react";

type ButtonProps = {
  variant: "primary" | "secondary" | "tertiary";
  onClick?: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  size?: string;
  disabled?: boolean;
  // TODO: type this using html attributes
  type?: "button" | "submit";
};

function Button(props: ButtonProps) {
  const { variant = "primary", onClick, children, title, className, style, size = "md", disabled, type = "button" } = props;

  const sizeClass = `size-${size}`;

  return (
    <button
      disabled={disabled}
      // eslint-disable-next-line react/button-has-type
      type={type}
      className={`t-btn t-btn-${variant} rounded-full ${sizeClass} ${className}`}
      onClick={onClick}
      title={title}
      style={style}
    >
      {children}
    </button>
  );
}

export default memo(Button);
