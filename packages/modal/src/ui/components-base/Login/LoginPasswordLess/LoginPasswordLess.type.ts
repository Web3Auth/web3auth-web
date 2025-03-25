import { FormEvent, MouseEvent as ReactMouseEvent } from "react";

export interface LoginPasswordLessProps {
  isPasswordLessCtaClicked: boolean;
  setIsPasswordLessCtaClicked: (isPasswordLessCtaClicked: boolean) => void;
  title: string;
  fieldValue: string;
  handleInputChange: (e: FormEvent<HTMLInputElement>) => void;
  placeholder: string;
  handleFormSubmit: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  invalidInputErrorMessage: string;
  isValidInput: boolean;
  isDark: boolean;
}
