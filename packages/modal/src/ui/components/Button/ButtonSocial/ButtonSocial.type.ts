import React, { JSX } from "react";

export interface ButtonSocialProps {
  text?: string;
  showIcon?: boolean;
  showText?: boolean;
  method?: string;
  isDark?: boolean;
  isPrimaryBtn?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: JSX.Element[] | JSX.Element;
  btnStyle?: string;
}
