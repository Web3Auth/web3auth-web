export interface LoginOtpProps {
  otpLoading: boolean;
  otpSuccess: boolean;
  setShowOtpFlow: (showOtpFlow: boolean) => void;
  isMobileOtp: boolean;
  handleOtpComplete: (otp: string) => void;
}

export type OtpInputProps = Pick<LoginOtpProps, "isMobileOtp" | "otpSuccess" | "setShowOtpFlow" | "handleOtpComplete">;
