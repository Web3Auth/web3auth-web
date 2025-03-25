import { rowType, SocialLoginEventType, SocialLoginsConfig } from "../../interfaces";

export interface SocialLoginListProps {
  isDark: boolean;
  visibleRow: rowType[];
  canShowMore: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExpandSocialLogins: () => void;
  otherRow?: rowType[];
}
