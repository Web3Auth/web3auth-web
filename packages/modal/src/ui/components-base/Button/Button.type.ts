import { ButtonSocialProps } from "./ButtonSocial";
import { ButtonWalletProps } from "./ButtonWallet";

export type ButtonType = "social" | "wallet";
export type ButtonPropsType = ButtonSocialProps | ButtonWalletProps;

export interface ButtonProps {
  type: ButtonType;
  props: ButtonPropsType;
}
