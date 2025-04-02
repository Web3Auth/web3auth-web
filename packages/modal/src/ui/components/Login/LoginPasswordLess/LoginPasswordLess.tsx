import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";

import { cn, getIcons } from "../../../utils";
import { LoginPasswordLessProps } from "./LoginPasswordLess.type";

function LoginPasswordLess(props: LoginPasswordLessProps) {
  const {
    isModalVisible,
    isPasswordLessCtaClicked,
    setIsPasswordLessCtaClicked,
    title,
    fieldValue,
    handleInputChange,
    placeholder,
    handleFormSubmit,
    invalidInputErrorMessage,
    isValidInput,
    isDark,
    buttonRadius,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const onInputChange = (e: FormEvent<HTMLInputElement>) => {
    handleInputChange(e);
    setIsInputFocused(true);
  };

  const onFormSubmit = (e: ReactMouseEvent<HTMLButtonElement>) => {
    handleFormSubmit(e);
    setIsInputFocused(false);
  };

  useEffect(() => {
    if (!isModalVisible) {
      setIsPasswordLessCtaClicked(false);
    }
  }, [isModalVisible, setIsPasswordLessCtaClicked]);

  useEffect(() => {
    if (isPasswordLessCtaClicked) {
      inputRef.current?.focus();
    }
  }, [isPasswordLessCtaClicked]);

  if (!isPasswordLessCtaClicked) {
    return (
      <button
        type="button"
        className={cn("w3a--btn !w3a--justify-between", {
          "w3a--rounded-full": buttonRadius === "pill",
          "w3a--rounded-lg": buttonRadius === "rounded",
          "w3a--rounded-none": buttonRadius === "square",
        })}
        onClick={() => {
          setIsPasswordLessCtaClicked(true);
        }}
      >
        <p className="w3a--text-app-gray-900 dark:w3a--text-app-white">Continue with {title}</p>
      </button>
    );
  }

  return (
    <>
      <div
        className={cn("w3a--input", isInputFocused && "!w3a--border-app-primary-600", {
          "w3a--rounded-full": buttonRadius === "pill",
          "w3a--rounded-lg": buttonRadius === "rounded",
          "w3a--rounded-none": buttonRadius === "square",
        })}
      >
        <input
          ref={inputRef}
          onInput={onInputChange}
          value={fieldValue}
          placeholder={placeholder}
          onFocus={() => {
            setIsInputFocused(true);
          }}
          onBlur={(e) => {
            e.target.placeholder = `${placeholder}`;
            setIsInputFocused(false);
          }}
          type="text"
          className={cn(
            "w3a--w-full w3a--appearance-none w3a--bg-transparent w3a--text-app-gray-900 w3a--outline-none placeholder:w3a--text-xs placeholder:w3a--text-app-gray-400 focus:w3a--outline-none active:w3a--outline-none dark:w3a--text-app-white dark:placeholder:w3a--text-app-gray-500"
          )}
        />
        {fieldValue && isValidInput && isInputFocused && (
          <button type="button" className="w3a--icon-animation w3a--appearance-none" onClick={onFormSubmit}>
            <img src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")} alt="arrow" />
          </button>
        )}
      </div>
      {!isValidInput && isPasswordLessCtaClicked && (
        <p className="-w3a--mt-2 w3a--w-full w3a--pl-6 w3a--text-start w3a--text-xs w3a--font-normal w3a--text-app-red-500 dark:w3a--text-app-red-400">
          {invalidInputErrorMessage}
        </p>
      )}
    </>
  );
}

export default LoginPasswordLess;
