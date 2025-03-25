import { rowType, SocialLoginsConfig } from "../../interfaces";

export interface SocialLoginListProps {
  isDark: boolean;
  visibleRow: rowType[];
  canShowMore: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  handleSocialLoginClick: (params: { connector: string; loginParams: { loginProvider: string; login_hint?: string; name: string } }) => void;
  handleExpandSocialLogins: () => void;
  otherRow?: rowType[];
}
