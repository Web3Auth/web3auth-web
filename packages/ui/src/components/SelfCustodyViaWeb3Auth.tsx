import { useTranslation } from "react-i18next";

import i18n from "../localeImport";

export default function SelfCustodyViaWeb3Auth() {
  const [t] = useTranslation(undefined, { i18n });

  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="text-xs text-app-gray-300 dark:text-app-gray-500">{t("modal.footer.message-new")}</div>
      <img height="16" src="https://images.web3auth.io/web3auth-footer-logo-light.svg" alt="Web3Auth Logo Light" className="h-4 block dark:hidden" />
      <img height="16" src="https://images.web3auth.io/web3auth-footer-logo-dark.svg" alt="Web3Auth Logo Dark" className="h-4 hidden dark:block" />
    </div>
  );
}
