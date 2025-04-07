import { ClipboardEvent, FormEvent, forwardRef, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../../localeImport";
import { cn } from "../../utils";
import { OtpProps } from "./Otp.type";

const OtpInput = forwardRef<HTMLDivElement, OtpProps>(
  (
    {
      length,
      resendTimer,
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
      "w3a--text-xs w3a--font-normal w3a--text-app-gray-500 dark:w3a--text-app-white w3a--mt-2",
      {
        "w3a--text-app-red-500 dark:w3a--text-app-red-400": error,
        "w3a--text-app-green-500 dark:w3a--text-app-green-400": success,
      },
      classes?.helperText
    );

    const inputKey = new Date().getFullYear();

    return (
      <div className={cn("w3a--flex w3a--flex-col w3a--items-center", classes?.root)} ref={ref}>
        <form className={cn("w3a--flex w3a--space-x-2", classes?.inputContainer)}>
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
                "w3a--w-12 w3a--h-[42px] w3a--rounded-full w3a--border w3a--text-center w3a--text-xl w3a--focus:outline-none w3a--active:outline-none w3a--focus:border-app-primary-600 dark:w3a--focus:border-app-primary-500 w3a--border-app-gray-300 dark:w3a--border-app-gray-500 w3a--bg-app-gray-50 dark:w3a--bg-app-gray-700 w3a--text-app-gray-900 dark:w3a--text-app-white",
                success &&
                  (classes?.success ??
                    "w3a--border-app-green-400 dark:w3a--border-app-green-500 w3a--focus:w3a--border-app-green-400 dark:w3a--focus:w3a--border-app-green-500"),
                error &&
                  (classes?.error ??
                    "w3a--border-app-red-600 dark:w3a--border-app-red-500 w3a--focus:w3a--border-app-red-600 dark:w3a--focus:w3a--border-app-red-500"),
                disabled &&
                  (classes?.disabled ??
                    "w3a--border-app-gray-200 w3a--bg-app-gray-200 dark:w3a--border-app-gray-700 w3a--focus:w3a--border-app-gray-200 dark:w3a--focus:w3a--border-app-gray-700 w3a--cursor-not-allowed"),
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
        {showCta && (
          <div className={cn("w3a--flex w3a--items-center w3a--mt-3", classes?.ctaContainer)}>
            {timer > 0 && showTimer && !disabled ? (
              <span className={cn("w3a--text-xs w3a--text-app-gray-500 dark:w3a--text-app-gray-400", classes?.timerText)}>
                {t("modal.resendTimer", { timer: timer })}
              </span>
            ) : (
              <button
                type="button"
                className={cn("w3a--text-xs w3a--p-0 w3a--text-app-primary-600 dark:w3a--text-app-primary-500", classes?.resendBtnText)}
                onClick={handleResendClick}
                disabled={(timer > 0 && showTimer) || disabled}
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
