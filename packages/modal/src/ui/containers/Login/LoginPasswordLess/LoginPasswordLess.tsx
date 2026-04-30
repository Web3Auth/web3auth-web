import { FormEvent, KeyboardEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import PulseLoader from "../../../components/PulseLoader";
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

  const handleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;
    if (key === "Enter") {
      handleFormSubmit(inputValue);
      setIsInputFocused(false);
    }
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
        className={cn("w3a--btn wta:justify-between! wta:relative wta:group wta:overflow-hidden", {
          "wta:rounded-full": buttonRadius === "pill",
          "wta:rounded-lg": buttonRadius === "rounded",
          "wta:rounded-none": buttonRadius === "square",
        })}
        onClick={() => {
          setIsPasswordLessCtaClicked(true);
        }}
      >
        <p className="wta:text-app-gray-900 wta:dark:text-app-white">{t("modal.passwordless.title", { title })}</p>
        <img
          id="passwordless-arrow"
          className="wta:absolute wta:right-4 wta:top-1/2 wta:-translate-x-6 wta:-translate-y-1/2 wta:opacity-0 wta:transition-all wta:duration-300
          wta:group-hover:translate-x-0 wta:group-hover:opacity-100"
          src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
          alt="arrow"
        />
      </button>
    );
  }

  return (
    <>
      <div
        className={cn("w3a--input", isInputFocused && "wta:border-app-primary-600!", {
          "wta:rounded-full": buttonRadius === "pill",
          "wta:rounded-lg": buttonRadius === "rounded",
          "wta:rounded-none": buttonRadius === "square",
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
            "wta:w-full wta:appearance-none wta:bg-transparent wta:text-app-gray-900 wta:outline-none wta:placeholder:text-xs wta:placeholder:text-app-gray-400 wta:focus:outline-none wta:active:outline-none wta:dark:text-app-white wta:dark:placeholder:text-app-gray-500"
          )}
          onKeyDown={(e) => handleEnter(e)}
          disabled={isPasswordLessLoading}
        />
        {isPasswordLessLoading && <PulseLoader />}
        {inputValue && !isPasswordLessLoading && (
          <button type="button" className="wta:appearance-none" onClick={onFormSubmit}>
            <img src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")} alt="arrow" />
          </button>
        )}
      </div>
      {errorMessage && !isInputFocused && isPasswordLessCtaClicked && (
        <p className="wta:w-full wta:pl-6 wta:text-start wta:text-xs wta:font-normal wta:text-app-red-500 wta:dark:text-app-red-400">
          {errorMessage}
        </p>
      )}
    </>
  );
}

export default LoginPasswordLess;
