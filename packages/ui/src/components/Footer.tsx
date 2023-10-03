import { memo } from "react";
import { useTranslation } from "react-i18next";

function Footer() {
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
            <a href="https://docs.web3auth.io/legal/terms-and-conditions" target="_blank" rel="noreferrer noopener">
              {t("modal.footer.terms-service")}
            </a>
            <span>|</span>
            <a href="https://docs.web3auth.io/legal/privacy-policy" target="_blank" rel="noreferrer noopener">
              {t("modal.footer.policy")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Footer);
