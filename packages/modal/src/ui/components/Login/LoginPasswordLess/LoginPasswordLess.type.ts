export interface LoginPasswordLessProps {
  isModalVisible: boolean;
  isPasswordLessCtaClicked: boolean;
  isPasswordLessLoading: boolean;
  title: string;
  placeholder: string;
  invalidInputErrorMessage: string;
  isValidInput: boolean;
  isDark: boolean;
  handleFormSubmit: (loginHint: string) => void;
  setIsPasswordLessCtaClicked: (isPasswordLessCtaClicked: boolean) => void;
}
