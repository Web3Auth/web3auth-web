export interface LoginOtpProps {
  otpLoading: boolean;
  otpSuccess: boolean;
  isMobileOtp: boolean;
  setShowOtpFlow: (showOtpFlow: boolean) => void;
  handleOtpComplete: (otp: string) => void;
}

export type OtpInputProps = Pick<LoginOtpProps, "isMobileOtp" | "otpSuccess" | "setShowOtpFlow" | "handleOtpComplete">;
