import { ClipboardEvent, FormEvent, forwardRef, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../../localeImport";
import { cn } from "../../utils";
import PulseLoader from "../PulseLoader";
import { OtpProps } from "./Otp.type";

const OtpInput = forwardRef<HTMLDivElement, OtpProps>(
  (
    {
      length,
      loading,
      resendTimer = 60,
      onComplete,
      onChange,
      error = false,
      success = false,
      disabled = false,
      classes,
      helperText = "",
      onResendTimer,
      showCta = true,
      showTimer = true,
      autoFocus = false,
      placeholder = "",
      autoComplete = "one-time-code",
      type = "text",
      resendBtnText = "",
    },
    ref
  ) => {
    const [otpArray, setOtpArray] = useState<string[]>(Array(length).fill(""));
    const [timer, setTimer] = useState<number>(resendTimer ?? 0);
    const [t] = useTranslation(undefined, { i18n });

    const inputRefs = useRef<HTMLInputElement[]>([]);

    const isInputValueValid = (value: string) => {
      return /^\d$/.test(value) && value.trim().length === 1;
    };

    const handleKeyDown = (e: KeyboardEvent, index: number) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const newOtpArray = [...otpArray];
        if (otpArray[index] !== "") {
          newOtpArray[index] = "";
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
          newOtpArray[index - 1] = "";
        }
        setOtpArray(newOtpArray);
        if (onChange) onChange(newOtpArray.join(""));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      } else if (e.key === " " || e.key === "Spacebar" || e.key === "Space" || (!isInputValueValid(e.key) && inputRefs.current[index + 1])) {
        e.preventDefault();
        inputRefs.current[index + 1].value = "";
      }
    };

    const handleInputChange = (e: FormEvent, index: number) => {
      e.preventDefault();
      const { value } = e.target as HTMLInputElement;
      if (value && value.length > 1 && value.length === length) {
        const pastedOtp = value.split("");
        const newOtpArray = [...otpArray];
        pastedOtp.forEach((key, idx) => {
          newOtpArray[idx] = key;
        });
        setOtpArray(newOtpArray);
        inputRefs.current[pastedOtp.length === length ? length - 1 : pastedOtp.length]?.focus();
        if (onComplete && length === newOtpArray.length) onComplete(newOtpArray.join(""));
      } else if (isInputValueValid(value)) {
        const newOtpArray = [...otpArray].slice(0, length);
        newOtpArray[index] = value;
        setOtpArray(newOtpArray);
        const otp = newOtpArray.join("");
        // Move focus to the next input
        if (index < length - 1 && inputRefs.current[index + 1]) {
          inputRefs.current[index + 1]?.focus();
        }
        if (onChange) onChange(value);
        if (onComplete && length === otp.length) onComplete(otp);
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").slice(0, length);
      if (pastedData && /^\d+$/.test(pastedData)) {
        const pastedOtp = pastedData.split("");
        const newOtpArray = [...otpArray];
        pastedOtp.forEach((key, index) => {
          newOtpArray[index] = key;
        });
        setOtpArray(newOtpArray);
        inputRefs.current[pastedOtp.length === length ? length - 1 : pastedOtp.length]?.focus();
        if (onComplete && length === newOtpArray.length) onComplete(newOtpArray.join(""));
      }
    };

    const handleResendClick = () => {
      setTimer(resendTimer || 0);
      if (onResendTimer) onResendTimer();
    };

    useEffect(() => {
      let interval: number | null = null;
      // Start the resend timer
      if (showCta && showTimer) {
        interval = window.setInterval(() => {
          if (timer > 0) {
            setTimer((prev) => prev - 1);
          } else {
            clearInterval(interval as number);
          }
        }, 1000);
      }
      return () => {
        clearInterval(interval as number);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timer]);

    useEffect(() => {
      if (inputRefs && autoFocus) {
        inputRefs.current?.[0].focus();
      }
    }, [autoFocus]);

    const helperTextClass = cn(
      "wta:text-xs wta:font-normal wta:text-app-gray-500 wta:dark:text-app-white wta:mt-2",
      {
        "wta:text-app-red-500 wta:dark:text-app-red-400": error,
        "wta:text-app-green-500 wta:dark:text-app-green-400": success,
      },
      classes?.helperText
    );

    const inputKey = new Date().getFullYear();

    return (
      <div className={cn("wta:flex wta:flex-col wta:items-center", classes?.root)} ref={ref}>
        <form className={cn("wta:flex wta:space-x-2", classes?.inputContainer)}>
          {otpArray.map((digit, index) => (
            <input
              id={`${inputKey + index}`}
              key={`${inputKey + index}`}
              type={type}
              value={digit}
              autoComplete={autoComplete}
              placeholder={Array.isArray(placeholder) ? placeholder[index] : placeholder}
              inputMode="numeric"
              onInput={(e) => handleInputChange(e, index)}
              onKeyUp={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={cn(
                "wta:w-12 wta:h-[42px] wta:rounded-full wta:border wta:text-center wta:text-xl wta:focus:outline-none wta:active:outline-none wta:focus:border-app-primary-600 wta:dark:focus:border-app-primary-500 wta:border-app-gray-300 wta:dark:border-app-gray-500 wta:bg-app-gray-50 wta:dark:bg-app-gray-700 wta:text-app-gray-900 wta:dark:text-app-white",
                success &&
                  (classes?.success ??
                    "wta:border-app-green-400 wta:dark:border-app-green-500 wta:focus:border-app-green-400 wta:dark:focus:border-app-green-500"),
                error &&
                  (classes?.error ??
                    "wta:border-app-red-600 wta:dark:border-app-red-500 wta:focus:border-app-red-600 wta:dark:focus:border-app-red-500"),
                disabled &&
                  (classes?.disabled ??
                    "wta:border-app-gray-200 wta:bg-app-gray-200 wta:dark:border-app-gray-700 wta:focus:border-app-gray-200 wta:dark:focus:border-app-gray-700 wta:cursor-not-allowed"),
                classes?.input
              )}
              ref={(el) => {
                inputRefs.current[index] = el as HTMLInputElement;
              }}
              disabled={disabled}
            />
          ))}
        </form>
        {helperText && <p className={helperTextClass}>{helperText}</p>}
        {loading && (
          <div className="wta:mt-3">
            <PulseLoader />
          </div>
        )}
        {showCta && !loading && (
          <div className={cn("wta:flex wta:items-center wta:mt-3", classes?.ctaContainer)}>
            {timer > 0 && showTimer ? (
              <span className={cn("wta:text-xs wta:text-app-gray-500 wta:dark:text-app-gray-400", classes?.timerText)}>
                {t("modal.resendTimer", { timer: timer })}
              </span>
            ) : (
              <button
                type="button"
                className={cn("wta:text-xs wta:p-0 wta:text-app-primary-600 wta:dark:text-app-primary-500", classes?.resendBtnText)}
                onClick={handleResendClick}
                disabled={timer > 0 && showTimer}
              >
                {resendBtnText || t("modal.resendCode")}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

OtpInput.displayName = "OtpInput";
export default OtpInput;
