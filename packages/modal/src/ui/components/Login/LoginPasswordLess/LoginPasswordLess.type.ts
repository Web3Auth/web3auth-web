import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";

import { ButtonRadiusType } from "../../../interfaces";

export interface LoginPasswordLessProps {
  isModalVisible: boolean;
  isPasswordLessCtaClicked: boolean;
  title: string;
  fieldValue: string;
  placeholder: string;
  invalidInputErrorMessage: string;
  isValidInput: boolean;
  isDark: boolean;
  setIsPasswordLessCtaClicked: (isPasswordLessCtaClicked: boolean) => void;
  handleInputChange: (e: FormEvent<HTMLInputElement>) => void;
  handleFormSubmit: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  buttonRadius?: ButtonRadiusType;
}
