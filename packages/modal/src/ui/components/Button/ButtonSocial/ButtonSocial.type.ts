import { JSX, MouseEvent } from "react";

export interface ButtonSocialProps {
  text?: string;
  showIcon?: boolean;
  showText?: boolean;
  method?: string;
  isDark?: boolean;
  isPrimaryBtn?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: JSX.Element[] | JSX.Element;
  btnStyle?: string;
}
