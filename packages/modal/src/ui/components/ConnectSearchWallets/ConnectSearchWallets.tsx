import { createSignal, Show } from "solid-js";

import { t } from "../../localeImport";
import { cn } from "../../utils/common";

export interface ConnectSearchWalletsProps {
  totalExternalWallets: number;
  isLoading: boolean;
  walletSearch: string;
  handleWalletSearch: (e: InputEvent) => void;
}

const ConnectSearchWallets = (props: ConnectSearchWalletsProps) => {
  const [isInputFocused, setIsInputFocused] = createSignal(false);

  const handleWalletSearch = (e: InputEvent) => {
    props.handleWalletSearch(e);
    setIsInputFocused(true);
  };

  return (
    <Show
      when={props.totalExternalWallets > 15 && !props.isLoading}
      fallback={<div class="w3a--w-full w3a--h-[50px] w3a--animate-pulse w3a--rounded-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700" />}
    >
      <input
        type="text"
        value={props.walletSearch}
        onInput={handleWalletSearch}
        onFocus={(e) => {
          e.target.placeholder = "";
          setIsInputFocused(true);
        }}
        onBlur={(e) => {
          e.target.placeholder = t("modal.external.search-wallet", { count: `${props.totalExternalWallets}` });
          setIsInputFocused(false);
        }}
        placeholder={
          props.isLoading ? t("modal.external.search-wallet-loading") : t("modal.external.search-wallet", { count: `${props.totalExternalWallets}` })
        }
        disabled={props.isLoading}
        class={cn(
          "w3a--input w3a--appearance-none w3a--outline-none active:w3a--outline-none focus:w3a--outline-none w3a--bg-transparent placeholder:w3a--text-app-gray-400 dark:placeholder:w3a--text-app-gray-500 w3a--text-app-gray-900 dark:w3a--text-app-white",
          isInputFocused() && "!w3a--border-app-primary-600"
        )}
      />
    </Show>
  );
};

export default ConnectSearchWallets;
