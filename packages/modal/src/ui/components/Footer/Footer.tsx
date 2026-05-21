import { useTranslation } from "react-i18next";

import i18n from "../../localeImport";
import { FooterProps } from "./Footer.type";
/**
 * Footer component
 * @returns Footer component
 */
function Footer({ privacyPolicy, termsOfService }: FooterProps) {
  const [t] = useTranslation(undefined, { i18n });

  return (
    <div className="wta:mx-auto wta:mt-auto wta:flex wta:flex-col wta:items-center wta:justify-center wta:gap-y-4 wta:pt-5">
      {(privacyPolicy || termsOfService) && (
        <p className="wta:mx-auto wta:w-4/5 wta:text-center wta:text-xs wta:text-app-gray-500 wta:dark:text-app-gray-400">
          {t("modal.footer.by-signing-in")}{" "}
          {termsOfService && (
            <a href={termsOfService} className="wta:text-app-primary-600 wta:dark:text-app-primary-500">
              {t("modal.footer.terms-of-service")}{" "}
            </a>
          )}
          {privacyPolicy && (
            <>
              {t("modal.footer.and")}{" "}
              <a href={privacyPolicy} className="wta:text-app-primary-600 wta:dark:text-app-primary-500">
                {t("modal.footer.privacy-policy")}
              </a>
            </>
          )}
        </p>
      )}
      <div className="wta:flex wta:items-center wta:justify-center wta:gap-2">
        <img
          height="36"
          src="https://images.web3auth.io/metamask-footer-logo-light.svg"
          alt="Web3Auth Logo Light"
          className="wta:block wta:h-9 wta:dark:hidden"
        />
        <img
          height="36"
          src="https://images.web3auth.io/metamask-footer-logo-dark.svg"
          alt="Web3Auth Logo Dark"
          className="wta:hidden wta:h-9 wta:dark:block"
        />
      </div>
    </div>
  );
}

export default Footer;
