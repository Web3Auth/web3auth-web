/* eslint-disable solid/reactivity */
import { createEffect, createSignal, For, JSX, mergeProps, onCleanup } from "solid-js";

export type OtpInputClassesType =
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

export interface OtpProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "onChange" | "placeholder"> {
  length: number;
  resendTimer?: number;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
  onResendTimer?: () => void;
  resendBtnText?: string;
  classes?: Partial<Record<OtpInputClassesType, string>>;
  helperText?: string;
  showCta?: boolean;
  showTimer?: boolean;
  autoFocus?: boolean;
  autoComplete?: HTMLInputElement["autocomplete"];
  placeholder?: string | string[];
  type?: "text" | "number" | "password";
}

const OtpInput = (props: OtpProps) => {
  const mergedProps = mergeProps(
    {
      length: 6,
      resendTimer: 0,
      onComplete: () => {},
      onChange: () => {},
      error: false,
      success: false,
      disabled: false,
      resendBtnText: "Resend Code",
      classes: {},
      helperText: "",
      onResendTimer: () => {},
      showCta: true,
      showTimer: true,
      autoFocus: false,
      placeholder: "",
      autoComplete: "one-time-code",
      type: "text",
    },
    props
  );

  const [otpArray, setOtpArray] = createSignal<string[]>(Array(mergedProps.length).fill(""));
  const [timer, setTimer] = createSignal(mergedProps.resendTimer);
  const inputRefs: HTMLInputElement[] = [];

  const isInputValueValid = (value: string) => /^\d$/.test(value) && value.trim().length === 1;

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    // eslint-disable-next-line no-console
    console.log(`Key Pressed: ${e.key} at index ${index}`);
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const newOtpArray = [...otpArray()];

      if (newOtpArray[index] !== "") {
        // Clear current value
        newOtpArray[index] = "";
      } else if (index > 0) {
        // Move focus to previous input and clear it
        inputRefs[index - 1]?.focus();
        newOtpArray[index - 1] = "";
      }

      setOtpArray(newOtpArray);
      mergedProps.onChange?.(newOtpArray.join(""));
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < mergedProps.length - 1) {
      e.preventDefault();
      inputRefs[index + 1]?.focus();
    }
  };

  const handleInputChange = (e: InputEvent, index: number) => {
    e.preventDefault();
    const { value } = e.target as HTMLInputElement;
    // eslint-disable-next-line no-console
    console.log("Input Value:", value);
    if (isInputValueValid(value)) {
      const newOtpArray = [...otpArray()];
      newOtpArray[index] = value;
      setOtpArray(newOtpArray);
      // eslint-disable-next-line no-console
      console.log("Updated OTP Array:", newOtpArray);
      if (index < mergedProps.length - 1 && inputRefs[index + 1]) {
        // eslint-disable-next-line no-console
        console.log("Moving to next input...");
        inputRefs[index + 1]?.focus();
      }
      const otp = newOtpArray.join("");
      mergedProps.onChange?.(otp);
      if (otp.length === mergedProps.length) {
        mergedProps.onComplete(otp);
      }
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData?.getData("text").slice(0, mergedProps.length);

    if (pastedData && /^\d+$/.test(pastedData)) {
      // console.log("Paste event triggered", pastedData);

      const newOtpArray = [...otpArray()]; // Preserve existing OTP array
      pastedData.split("").forEach((char, index) => {
        newOtpArray[index] = char; // Fill pasted values in order
      });

      setOtpArray(newOtpArray); // Update state with the new array
      const nextFocusIndex = Math.min(pastedData.length, mergedProps.length - 1);
      setTimeout(() => inputRefs[nextFocusIndex]?.focus(), 0); // Move focus after pasting

      if (pastedData.length === mergedProps.length) {
        mergedProps.onComplete?.(newOtpArray.join(""));
      }
    }
  };

  const handleResendClick = () => {
    setTimer(mergedProps.resendTimer);
    mergedProps.onResendTimer?.();
  };

  createEffect(() => {
    let interval: number | null = null;
    if (mergedProps.showCta && mergedProps.showTimer) {
      interval = window.setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      createEffect(() => {
        if (timer() === 0 && interval) {
          clearInterval(interval);
        }
      });
    }
    onCleanup(() => interval && clearInterval(interval));
  });

  createEffect(() => {
    if (inputRefs.length > 0 && mergedProps.autoFocus) {
      inputRefs[0]?.focus();
    }
  });

  return (
    <div class={`w3a--flex w3a--flex-col w3a--items-center ${mergedProps.classes?.root || ""}`}>
      <form class={`w3a--flex w3a--space-x-2 ${mergedProps.classes?.inputContainer || ""}`}>
        <For each={otpArray()}>
          {(digit, index) => (
            <input
              ref={(el) => (inputRefs[index()] = el)}
              id={`otp-${index()}`}
              type={mergedProps.type}
              value={digit}
              // autoComplete={mergedProps.autoComplete}
              placeholder={Array.isArray(mergedProps.placeholder) ? mergedProps.placeholder[index()] : mergedProps.placeholder}
              inputMode="numeric"
              class={`w3a--w-12 w3a--h-[42px] w3a--rounded-full w3a--border w3a--text-center w3a--text-xl w3a--focus:outline-none w3a--active:outline-none 
              w3a--focus:border-app-primary-600 dark:w3a--focus:border-app-primary-500 
              w3a--border-app-gray-300 dark:w3a--border-app-gray-500 
              w3a--bg-app-gray-50 dark:w3a--bg-app-gray-700 
              w3a--text-app-gray-900 dark:w3a--text-app-white
              ${mergedProps.success ? mergedProps.classes?.success || "w3a--border-app-green-400 dark:w3a--border-app-green-500" : ""}
              ${mergedProps.error ? mergedProps.classes?.error || "w3a--border-app-red-600 dark:w3a--border-app-red-500" : ""}
              ${mergedProps.disabled ? mergedProps.classes?.disabled || "w3a--cursor-not-allowed w3a--border-app-gray-200 w3a--bg-app-gray-200 dark:w3a--border-app-gray-700" : ""}
              ${mergedProps.classes?.input || ""}`}
              disabled={mergedProps.disabled}
              onInput={(e) => handleInputChange(e, index())}
              onKeyDown={(e) => handleKeyDown(e, index())}
              onPaste={handlePaste}
            />
          )}
        </For>
      </form>
      {mergedProps.helperText && (
        <p
          class={`w3a--text-xs w3a--font-normal w3a--mt-2 ${mergedProps.error ? "w3a--text-app-red-500" : mergedProps.success ? "w3a--text-app-green-500" : "w3a--text-app-gray-500"} ${mergedProps.classes?.helperText || ""}`}
        >
          {mergedProps.helperText}
        </p>
      )}
      {mergedProps.showCta && (
        <div class={`w3a--flex w3a--items-center w3a--mt-3 ${mergedProps.classes?.ctaContainer || ""}`}>
          {timer() > 0 && mergedProps.showTimer && !mergedProps.disabled ? (
            <span class={`w3a--text-xs w3a--text-app-gray-500 dark:w3a--text-app-gray-400 ${mergedProps.classes?.timerText || ""}`}>
              Resend in {timer()} seconds
            </span>
          ) : (
            <button
              class={`w3a--text-xs w3a--p-0 w3a--text-app-primary-600 dark:w3a--text-app-primary-500 ${mergedProps.classes?.resendBtnText || ""}`}
              onClick={handleResendClick}
              disabled={(timer() > 0 && mergedProps.showTimer) || mergedProps.disabled}
            >
              {mergedProps.resendBtnText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OtpInput;
