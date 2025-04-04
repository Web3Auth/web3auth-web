import { ButtonSocialProps } from "./ButtonSocial";
import { ButtonWalletProps } from "./ButtonWallet";

export const BUTTON_TYPE = {
  SOCIAL: "social",
  WALLET: "wallet",
} as const;

export type ButtonType = (typeof BUTTON_TYPE)[keyof typeof BUTTON_TYPE];
export type ButtonPropsType = ButtonSocialProps | ButtonWalletProps;

export interface ButtonProps {
  type: ButtonType;
  props: ButtonPropsType;
}
