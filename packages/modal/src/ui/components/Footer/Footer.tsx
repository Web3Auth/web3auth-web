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
    <div className="w3a--mx-auto w3a--mt-auto w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--pt-5">
      {(privacyPolicy || termsOfService) && (
        <p className="w3a--mx-auto w3a--w-4/5 w3a--text-center w3a--text-xs w3a--text-app-gray-500 dark:w3a--text-app-gray-400">
          {t("modal.footer.by-signing-in")}{" "}
          {termsOfService && (
            <a href={termsOfService} className="w3a--text-app-primary-600 dark:w3a--text-app-primary-500">
              {t("modal.footer.terms-of-service")}{" "}
            </a>
          )}
          {privacyPolicy && (
            <>
              {t("modal.footer.and")}{" "}
              <a href={privacyPolicy} className="w3a--text-app-primary-600 dark:w3a--text-app-primary-500">
                {t("modal.footer.privacy-policy")}
              </a>
            </>
          )}
        </p>
      )}
      <div className="w3a--flex w3a--items-center w3a--justify-center w3a--gap-2">
        <img
          height="36"
          src="https://images.web3auth.io/metamask-footer-logo-light.svg"
          alt="Web3Auth Logo Light"
          className="w3a--block w3a--h-4 dark:w3a--hidden"
        />
        <img
          height="36"
          src="https://images.web3auth.io/metamask-footer-logo-dark.svg"
          alt="Web3Auth Logo Dark"
          className="w3a--hidden w3a--h-4 dark:w3a--block"
        />
      </div>
    </div>
  );
}

export default Footer;
