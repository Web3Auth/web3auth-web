import { getIcons } from "../../../utils";
import Otp from "../../Otp";
import { LoginOtpProps, OtpInputProps } from "./LoginOtp.type";

/**
 * OtpInput component
 * @param props - OtpInputProps
 * @returns OtpInput component
 */
function OtpInput(props: OtpInputProps) {
  const { isMobileOtp, otpSuccess, setShowOtpFlow, handleOtpComplete } = props;

  if (otpSuccess) {
    return (
      <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--w-full w3a--h-full w3a--flex-1">
        <img src={getIcons("success-light")} alt="success" className="w3a--w-auto w3a--h-auto" />
        <p className="w3a--text-base w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white w3a--w-[80%] w3a--mx-auto w3a--text-center">
          You are connected to your account!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="w3a--flex w3a--items-start w3a--justify-start w3a--mr-auto w3a--w-full">
        <button
          type="button"
          className="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--cursor-pointer w3a--flex w3a--items-center w3a--justify-center w3a--z-20"
          onClick={() => setShowOtpFlow(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="w3a--text-app-gray-900 dark:w3a--text-app-white">
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--w-full w3a--h-full w3a--flex-1">
        <img src={getIcons(isMobileOtp ? "sms-otp-light" : "email-otp-light")} alt="otp" className="w3a--w-auto w3a--h-auto" />
        <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2">
          <p className="w3a--text-lg w3a--font-bold w3a--text-app-gray-900 dark:w3a--text-app-white">
            {isMobileOtp ? "OTP verification" : "Email verification"}
          </p>
          <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-1">
            <p className="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">
              {isMobileOtp ? "Enter the OTP sent to" : "Please enter the 6-digit verification code "}
            </p>
            <p className="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">
              {isMobileOtp ? "🇸🇬+91 ****0999" : "that was sent to your email ja****@email.com"}
            </p>
          </div>
        </div>
        <Otp length={6} onComplete={handleOtpComplete} />
      </div>
    </>
  );
}

/**
 * LoginOtp component
 * @param props - LoginOtpProps
 * @returns LoginOtp component
 */
function LoginOtp(props: LoginOtpProps) {
  const { otpLoading, otpSuccess, setShowOtpFlow, isMobileOtp, handleOtpComplete } = props;

  return (
    <div className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--w-full w3a--h-full w3a--flex-1">
      {otpLoading ? (
        <div className="w3a--flex w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--w-full w3a--h-full w3a--flex-1 w3a--gap-x-2">
          <div className="w3a--w-3 w3a--h-3 w3a--rounded-full w3a--bg-app-primary-600 dark:w3a--bg-app-primary-500 w3a--animate-pulse" />
          <div className="w3a--w-3 w3a--h-3 w3a--rounded-full w3a--bg-app-primary-500 dark:w3a--bg-app-primary-400 w3a--animate-pulse" />
          <div className="w3a--w-3 w3a--h-3 w3a--rounded-full w3a--bg-app-primary-400 dark:w3a--bg-app-primary-300 w3a--animate-pulse" />
        </div>
      ) : (
        <OtpInput isMobileOtp={isMobileOtp} otpSuccess={otpSuccess} setShowOtpFlow={setShowOtpFlow} handleOtpComplete={handleOtpComplete} />
      )}
    </div>
  );
}

export default LoginOtp;
