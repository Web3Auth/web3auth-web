import { Show } from "solid-js";

import { getIcons } from "../../utils/common";
import OtpInput from "../Otp/Otp";

export interface LoginOtpProps {
  otpLoading: boolean;
  otpSuccess: boolean;
  setShowOtpFlow: (showOtpFlow: boolean) => void;
  isMobileOtp: boolean;
  handleOtpComplete: (otp: string) => void;
}

const LoginOtp = (props: LoginOtpProps) => {
  return (
    <div class="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--w-full w3a--h-full w3a--flex-1">
      <Show
        when={!props.otpLoading}
        fallback={
          <div class="w3a--flex w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--w-full w3a--h-full w3a--flex-1 w3a--gap-x-2">
            <div class="w3a--w-3 w3a--h-3 w3a--rounded-full w3a--bg-app-primary-600 dark:w3a--bg-app-primary-500 w3a--animate-pulse" />
            <div class="w3a--w-3 w3a--h-3 w3a--rounded-full w3a--bg-app-primary-500 dark:w3a--bg-app-primary-400 w3a--animate-pulse" />
            <div class="w3a--w-3 w3a--h-3 w3a--rounded-full w3a--bg-app-primary-400 dark:w3a--bg-app-primary-300 w3a--animate-pulse" />
          </div>
        }
      >
        <Show
          when={!props.otpSuccess}
          fallback={
            <div class="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--w-full w3a--h-full w3a--flex-1">
              <img src={getIcons("success-light")} alt="success" class="w3a--w-auto w3a--h-auto" />
              <p class="w3a--text-base w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white w3a--w-[80%] w3a--mx-auto w3a--text-center">
                You are connected to your account!
              </p>
            </div>
          }
        >
          <div class="w3a--flex w3a--items-start w3a--justify-start w3a--mr-auto w3a--w-full">
            <button
              class="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--cursor-pointer w3a--flex w3a--items-center w3a--justify-center w3a--z-20"
              onClick={() => props.setShowOtpFlow(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" class="w3a--text-app-gray-900 dark:w3a--text-app-white">
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div class="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--w-full w3a--h-full w3a--flex-1">
            <img src={getIcons(props.isMobileOtp ? "sms-otp-light" : "email-otp-light")} alt="otp" class="w3a--w-auto w3a--h-auto" />
            <div class="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-2">
              <p class="w3a--text-lg w3a--font-bold w3a--text-app-gray-900 dark:w3a--text-app-white">
                {props.isMobileOtp ? "OTP verification" : "Email verification"}
              </p>
              <div class="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-1">
                <p class="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">
                  {props.isMobileOtp ? "Enter the OTP sent to" : "Please enter the 6-digit verification code "}
                </p>
                <p class="w3a--text-sm w3a--font-normal w3a--text-app-gray-900 dark:w3a--text-app-white">
                  {props.isMobileOtp ? "🇸🇬+91 ****0999" : "that was sent to your email ja****@email.com"}
                </p>
              </div>
            </div>
            <OtpInput length={6} onComplete={props.handleOtpComplete} />
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default LoginOtp;
