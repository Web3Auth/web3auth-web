import { InputHTMLAttributes } from "react";

export type OtpClassesType =
  | "root"
  | "inputContainer"
  | "ctaContainer"
  | "resendBtnText"
  | "timerText"
  | "input"
  | "success"
  | "error"
  | "disabled"
  | "helperText";

export interface OtpProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "placeholder"> {
  length: number;
  loading?: boolean;
  resendTimer?: number;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
  onResendTimer?: () => void;
  resendBtnText?: string;
  classes?: Partial<Record<OtpClassesType, string>>;
  helperText?: string;
  showCta?: boolean;
  showTimer?: boolean;
  autoFocus?: boolean;
  autoComplete?: HTMLInputElement["autocomplete"];
  placeholder?: string | string[];
  type?: "text" | "number" | "password";
}
