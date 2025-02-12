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
      resendBtnText: "Resend OTP",
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
    const pastedData = e.clipboardData?.getData("text").slice(0, length);
    if (pastedData && /^\d+$/.test(pastedData)) {
      const newOtpArray = pastedData.split("");
      setOtpArray(newOtpArray);
      inputRefs[newOtpArray.length === mergedProps.length ? mergedProps.length - 1 : newOtpArray.length]?.focus();
      mergedProps.onComplete(newOtpArray.join(""));
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
    <div class={`flex flex-col items-center ${mergedProps.classes?.root || ""}`}>
      <form class={`flex space-x-2 ${mergedProps.classes?.inputContainer || ""}`}>
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
              class={`w-12 h-[42px] rounded-full border text-center text-xl focus:outline-none active:outline-none 
              focus:border-app-primary-600 dark:focus:border-app-primary-500 
              border-app-gray-300 dark:border-app-gray-500 
              bg-app-gray-50 dark:bg-app-gray-700 
              text-app-gray-900 dark:text-app-white
              ${mergedProps.success ? mergedProps.classes?.success || "border-app-green-400 dark:border-app-green-500" : ""}
              ${mergedProps.error ? mergedProps.classes?.error || "border-app-red-600 dark:border-app-red-500" : ""}
              ${mergedProps.disabled ? mergedProps.classes?.disabled || "cursor-not-allowed border-app-gray-200 bg-app-gray-200 dark:border-app-gray-700" : ""}
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
          class={`text-xs font-normal mt-2 ${mergedProps.error ? "text-app-red-500" : mergedProps.success ? "text-app-green-500" : "text-app-gray-500"} ${mergedProps.classes?.helperText || ""}`}
        >
          {mergedProps.helperText}
        </p>
      )}
      {mergedProps.showCta && (
        <div class={`flex items-center mt-3 ${mergedProps.classes?.ctaContainer || ""}`}>
          {timer() > 0 && mergedProps.showTimer && !mergedProps.disabled ? (
            <span class={`text-xs text-app-gray-500 dark:text-app-gray-400 ${mergedProps.classes?.timerText || ""}`}>
              Resend in {timer()} seconds
            </span>
          ) : (
            <button
              class={`text-sm p-0 ${mergedProps.classes?.resendBtnText || ""}`}
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
