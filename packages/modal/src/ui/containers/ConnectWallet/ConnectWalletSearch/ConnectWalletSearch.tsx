import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWidget } from "../../../context/WidgetContext";
import i18n from "../../../localeImport";
import { cn } from "../../../utils";
import { ConnectWalletSearchProps } from "./ConnectWalletSearch.type";

function ConnectWalletSearch(props: ConnectWalletSearchProps) {
  const { totalExternalWalletCount, isLoading, walletSearch, handleWalletSearch } = props;
  const { uiConfig } = useWidget();
  const { buttonRadiusType: buttonRadius } = uiConfig;

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [t] = useTranslation(undefined, { i18n });
  const onWalletSearch = (e: FormEvent<HTMLInputElement>) => {
    handleWalletSearch(e);
    setIsInputFocused(true);
  };

  // const isShowSearch = totalExternalWalletCount > 15 && !isLoading;

  // if (!isShowSearch) {
  //   return <div className="wta:h-[50px] wta:w-full wta:animate-pulse wta:rounded-full wta:bg-app-gray-200 wta:dark:bg-app-gray-700" />;
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
        "w3a--input wta:appearance-none wta:outline-none wta:active:outline-none wta:focus:outline-none wta:bg-transparent wta:placeholder:text-app-gray-400 wta:dark:placeholder:text-app-gray-500 wta:text-app-gray-900 wta:dark:text-app-white",
        isInputFocused && "wta:border-app-primary-600!",
        {
          "wta:rounded-full": buttonRadius === "pill",
          "wta:rounded-lg": buttonRadius === "rounded",
          "wta:rounded-none": buttonRadius === "square",
        }
      )}
    />
  );
}

export default ConnectWalletSearch;
