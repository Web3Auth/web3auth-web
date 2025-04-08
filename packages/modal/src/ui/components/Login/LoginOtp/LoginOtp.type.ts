import { type AUTH_CONNECTION_TYPE } from "@web3auth/auth";

export interface LoginOtpProps {
  otpLoading: boolean;
  authConnection: AUTH_CONNECTION_TYPE;
  loginHint?: string;
  errorMessage: string;
  setShowOtpFlow: (showOtpFlow: boolean) => void;
  handleOtpComplete: (otp: string) => void;
}

export type OtpInputProps = Pick<
  LoginOtpProps,
  "otpLoading" | "loginHint" | "setShowOtpFlow" | "handleOtpComplete" | "authConnection" | "errorMessage"
>;
