import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import { cn, getIcons } from "../../../utils";
import { LoginPasswordLessProps } from "./LoginPasswordLess.type";

function LoginPasswordLess(props: LoginPasswordLessProps) {
  const {
    isModalVisible,
    isPasswordLessCtaClicked,
    setIsPasswordLessCtaClicked,
    title,
    placeholder,
    handleFormSubmit,
    errorMessage,
    isDark,
    isPasswordLessLoading,
    buttonRadius,
  } = props;
  const [t] = useTranslation(undefined, { i18n });
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const onInputChange = (e: FormEvent<HTMLInputElement>) => {
    setInputValue((e.target as HTMLInputElement).value);
    setIsInputFocused(true);
  };

  const onFormSubmit = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFormSubmit(inputValue);
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
        <p className="w3a--text-app-gray-900 dark:w3a--text-app-white">{t("modal.passwordless.title", { title })}</p>
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
          value={inputValue}
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
        {isPasswordLessLoading && (
          // TODO: Add loading spinner
          <div>Loading..</div>
        )}
        {inputValue && !isPasswordLessLoading && (
          <button type="button" className="w3a--icon-animation w3a--appearance-none" onClick={onFormSubmit}>
            <img src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")} alt="arrow" />
          </button>
        )}
      </div>
      {errorMessage && !isInputFocused && isPasswordLessCtaClicked && (
        <p className="-w3a--mt-2 w3a--w-full w3a--pl-6 w3a--text-start w3a--text-xs w3a--font-normal w3a--text-app-red-500 dark:w3a--text-app-red-400">
          {errorMessage}
        </p>
      )}
    </>
  );
}

export default LoginPasswordLess;
