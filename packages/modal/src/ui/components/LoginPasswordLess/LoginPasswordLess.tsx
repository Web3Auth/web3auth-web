import { createSignal, Show } from "solid-js";

import { cn, getIcons } from "../../utils/common";

export interface LoginPasswordLessProps {
  isPasswordLessCtaClicked: boolean;
  setIsPasswordLessCtaClicked: (isPasswordLessCtaClicked: boolean) => void;
  title: string;
  fieldValue: string;
  handleInputChange: (e: InputEvent) => void;
  placeholder: string;
  handleFormSubmit: (e: Event) => void;
  invalidInputErrorMessage: string;
  isValidInput: boolean;
  isDark: boolean;
}

const LoginPasswordLess = (props: LoginPasswordLessProps) => {
  const [isInputFocused, setIsInputFocused] = createSignal(false);

  const handleInputChange = (e: InputEvent) => {
    props.handleInputChange(e);
    setIsInputFocused(true);
  };

  const handleFormSubmit = (e: Event) => {
    props.handleFormSubmit(e);
    setIsInputFocused(false);
  };

  return (
    <Show
      when={props.isPasswordLessCtaClicked}
      fallback={
        <button class={cn("w3a--btn !w3a--justify-between")} onClick={() => props.setIsPasswordLessCtaClicked(true)}>
          <p class="w3a--text-app-gray-900 dark:w3a--text-app-white">Continue with {props.title}</p>
        </button>
      }
    >
      <div class={cn("w3a--input", isInputFocused() && "!w3a--border-app-primary-600")}>
        <input
          onInput={handleInputChange}
          value={props.fieldValue}
          placeholder={props.placeholder}
          onFocus={(e) => {
            e.target.placeholder = "";
            setIsInputFocused(true);
          }}
          onBlur={(e) => {
            e.target.placeholder = `${props.placeholder}`;
            setIsInputFocused(false);
          }}
          type="text"
          autofocus
          class="w-full w3a--appearance-none w3a--outline-none active:w3a--outline-none focus:w3a--outline-none w3a--bg-transparent placeholder:w3a--text-xs placeholder:w3a--text-app-gray-400 dark:placeholder:w3a--text-app-gray-500 w3a--text-app-gray-900 dark:w3a--text-app-white"
        />
        <Show when={props.fieldValue && props.isValidInput && isInputFocused()}>
          <button class="w3a--appearance-none w3a--icon-animation" onClick={handleFormSubmit}>
            <img src={getIcons(props.isDark ? "chevron-right-dark" : "chevron-right-light")} alt="arrow" />
          </button>
        </Show>
      </div>
      <Show when={!props.isValidInput && props.isPasswordLessCtaClicked}>
        <p class="w3a--text-xs w3a--font-normal w3a--text-app-red-500 dark:w3a--text-app-red-400 w3a--text-start -w3a--mt-2 w3a--w-full w3a--pl-6">
          {props.invalidInputErrorMessage}
        </p>
      </Show>
    </Show>
  );
};

export default LoginPasswordLess;
