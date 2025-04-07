import { ButtonRadiusType, rowType, SocialLoginEventType, SocialLoginsConfig } from "../../interfaces";

export interface SocialLoginListProps {
  isDark: boolean;
  visibleRow: rowType[];
  canShowMore: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  otherRow?: rowType[];
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExpandSocialLogins: () => void;
  buttonRadius?: ButtonRadiusType;
}
