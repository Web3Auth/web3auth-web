import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import { cn } from "../../../utils";
import { ConnectWalletSearchProps } from "./ConnectWalletSearch.type";

function ConnectWalletSearch(props: ConnectWalletSearchProps) {
  const { totalExternalWalletCount, isLoading, walletSearch, handleWalletSearch, buttonRadius } = props;

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [t] = useTranslation(undefined, { i18n });
  const onWalletSearch = (e: FormEvent<HTMLInputElement>) => {
    handleWalletSearch(e);
    setIsInputFocused(true);
  };

  // const isShowSearch = totalExternalWalletCount > 15 && !isLoading;

  // if (!isShowSearch) {
  //   return <div className="w3a--h-[50px] w3a--w-full w3a--animate-pulse w3a--rounded-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700" />;
  // }

  return (
    <input
      type="text"
      value={walletSearch}
      onInput={onWalletSearch}
      onFocus={(e) => {
        e.target.placeholder = "";
        setIsInputFocused(true);
      }}
      onBlur={(e) => {
        e.target.placeholder = t("modal.external.search-wallet", { count: totalExternalWalletCount });
        setIsInputFocused(false);
      }}
      placeholder={isLoading ? t("modal.external.search-wallet-loading") : t("modal.external.search-wallet", { count: totalExternalWalletCount })}
      disabled={isLoading}
      className={cn(
        "w3a--input w3a--appearance-none w3a--outline-none active:w3a--outline-none focus:w3a--outline-none w3a--bg-transparent placeholder:w3a--text-app-gray-400 dark:placeholder:w3a--text-app-gray-500 w3a--text-app-gray-900 dark:w3a--text-app-white",
        isInputFocused && "!w3a--border-app-primary-600",
        {
          "w3a--rounded-full": buttonRadius === "pill",
          "w3a--rounded-lg": buttonRadius === "rounded",
          "w3a--rounded-none": buttonRadius === "square",
        }
      )}
    />
  );
}

export default ConnectWalletSearch;
