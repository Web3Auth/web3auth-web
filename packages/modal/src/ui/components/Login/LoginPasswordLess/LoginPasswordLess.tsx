import { FormEvent, MouseEvent as ReactMouseEvent, useState } from "react";

import { cn, getIcons } from "../../../utils";
import { LoginPasswordLessProps } from "./LoginPasswordLess.type";

function LoginPasswordLess(props: LoginPasswordLessProps) {
  const {
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
  } = props;
  const [isInputFocused, setIsInputFocused] = useState(false);

  const onInputChange = (e: FormEvent<HTMLInputElement>) => {
    handleInputChange(e);
    setIsInputFocused(true);
  };

  const onFormSubmit = (e: ReactMouseEvent<HTMLButtonElement>) => {
    handleFormSubmit(e);
    setIsInputFocused(false);
  };

  if (!isPasswordLessCtaClicked) {
    return (
      <button type="button" className={cn("w3a--btn !w3a--justify-between")} onClick={() => setIsPasswordLessCtaClicked(true)}>
        <p className="w3a--text-app-gray-900 dark:w3a--text-app-white">Continue with {title}</p>
      </button>
    );
  }

  return (
    <>
      <div className={cn("w3a--input", isInputFocused && "!w3a--border-app-primary-600")}>
        <input
          onInput={onInputChange}
          value={fieldValue}
          placeholder={placeholder}
          onFocus={(e) => {
            e.target.placeholder = "";
            setIsInputFocused(true);
          }}
          onBlur={(e) => {
            e.target.placeholder = `${placeholder}`;
            setIsInputFocused(false);
          }}
          type="text"
          className="w-full w3a--appearance-none w3a--outline-none active:w3a--outline-none focus:w3a--outline-none w3a--bg-transparent placeholder:w3a--text-xs placeholder:w3a--text-app-gray-400 dark:placeholder:w3a--text-app-gray-500 w3a--text-app-gray-900 dark:w3a--text-app-white"
        />
        {fieldValue && isValidInput && isInputFocused && (
          <button type="button" className="w3a--appearance-none w3a--icon-animation" onClick={onFormSubmit}>
            <img src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")} alt="arrow" />
          </button>
        )}
      </div>
      {!isValidInput && isPasswordLessCtaClicked && (
        <p className="w3a--text-xs w3a--font-normal w3a--text-app-red-500 dark:w3a--text-app-red-400 w3a--text-start -w3a--mt-2 w3a--w-full w3a--pl-6">
          {invalidInputErrorMessage}
        </p>
      )}
    </>
  );
}

export default LoginPasswordLess;
