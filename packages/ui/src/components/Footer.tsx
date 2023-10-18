import { WhiteLabelData } from "@toruslabs/openlogin-utils";
import { memo } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../localeImport";

type FooterProps = Partial<Pick<WhiteLabelData, "privacyPolicy" | "tncLink" | "defaultLanguage">>;

function Footer(props: FooterProps) {
  const { privacyPolicy, tncLink, defaultLanguage = "en" } = props;
  const [t] = useTranslation(undefined, { i18n });

  const getPrivacyUrl = () => {
    if (privacyPolicy && privacyPolicy?.[defaultLanguage]) return privacyPolicy[defaultLanguage];
    return "https://docs.web3auth.io/legal/privacy-policy";
  };

  const getTncUrl = () => {
    if (tncLink && tncLink?.[defaultLanguage]) return tncLink[defaultLanguage];
    return "https://docs.web3auth.io/legal/terms-and-conditions";
  };

  return (
    <div className="w3a-modal__footer">
      <div className="w3a-footer">
        <div>
          <div>
            <div>{t("modal.footer.message-new")}</div>
            {/* {web3authIcon} */}
          </div>
          <div className="w3a-footer__links">
            <a href={getTncUrl()} target="_blank" rel="noreferrer noopener">
              {t("modal.footer.terms-service")}
            </a>
            <span>|</span>
            <a href={getPrivacyUrl()} target="_blank" rel="noreferrer noopener">
              {t("modal.footer.policy")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Footer);
