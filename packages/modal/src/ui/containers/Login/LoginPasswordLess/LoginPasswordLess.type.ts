import { ButtonRadiusType } from "../../../interfaces";

export interface LoginPasswordLessProps {
  isModalVisible: boolean;
  isPasswordLessCtaClicked: boolean;
  isPasswordLessLoading: boolean;
  title: string;
  placeholder: string;
  errorMessage: string;
  isDark: boolean;
  buttonRadius?: ButtonRadiusType;
  handleFormSubmit: (loginHint: string) => void;
  setIsPasswordLessCtaClicked: (isPasswordLessCtaClicked: boolean) => void;
}
