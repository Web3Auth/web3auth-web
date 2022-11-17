import { memo } from "react";
import { useTranslation } from "react-i18next";

interface FooterProps {
  version: string;
}

function Footer(props: FooterProps) {
  const { version } = props;

  const [t] = useTranslation();

  return (
    <div className="w3a-modal__footer">
      <div className="w3a-footer">
        <div>
          <div>
            <div>{t("modal.footer.message-new")}</div>
            {/* {web3authIcon} */}
          </div>
          <div className="w3a-footer__links">
            <a href="https://docs.web3auth.io/legal/terms-and-conditions">{t("modal.footer.terms-service")}</a>
            <span>|</span>
            <a href="https://docs.web3auth.io/legal/privacy-policy">{t("modal.footer.policy")}</a>
            <span>|</span>
            <span>
              {`${t("modal.footer.version")} `}
              {version}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Footer);
