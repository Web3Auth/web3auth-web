import { For, Show } from "solid-js";

import { browser, ExternalButton, os, platform } from "../../interfaces";
import { t } from "../../localeImport";
import { cn, getIcons } from "../../utils/common";
import { WalletButton } from "../WalletButton";

export interface ConnectWalletListProps {
  externalButtons: ExternalButton[];
  isLoading: boolean;
  totalExternalWallets: number;
  initialWalletCount: number;
  handleWalletClick: (button: ExternalButton) => void;
  handleMoreWallets: () => void;
  isDark: boolean;
  deviceDetails: { platform: platform; browser: browser; os: os };
  walletConnectUri: string;
}

const ConnectWalletList = (props: ConnectWalletListProps) => {
  const handleMoreWallets = () => {
    props.handleMoreWallets();
  };

  return (
    <>
      <ul class={cn("w3a--overflow-y-auto w3a--flex w3a--flex-col w3a--gap-y-2 w3a--h-[calc(100dvh_-_420px)]")}>
        <Show
          when={props.externalButtons.length > 0}
          fallback={
            <div class="w3a--w-full w3a--text-center w3a--text-app-gray-400 dark:w3a--text-app-gray-500 w3a--py-6 w3a--flex w3a--justify-center w3a--items-center">
              {t("modal.external.no-wallets-found")}
            </div>
          }
        >
          <Show
            when={!props.isLoading}
            fallback={
              <div class="w3a--flex w3a--flex-col w3a--gap-y-2 w3a--pr-1.5">
                <For each={Array(6).fill(0)}>
                  {(_) => <div class="w3a--w-full w3a--h-12 w3a--animate-pulse w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700" />}
                </For>
              </div>
            }
          >
            <div class="w3a--flex w3a--flex-col w3a--gap-y-2 w3a--pr-1.5">
              <For each={props.externalButtons}>
                {(button) => (
                  <WalletButton
                    label={button.displayName}
                    onClick={() => props.handleWalletClick(button)}
                    button={button}
                    deviceDetails={props.deviceDetails}
                    walletConnectUri={props.walletConnectUri}
                  />
                )}
              </For>
            </div>
          </Show>
        </Show>
      </ul>
      <Show
        when={props.totalExternalWallets > 15 && !props.isLoading && props.initialWalletCount < props.totalExternalWallets}
        fallback={
          <Show when={props.initialWalletCount < props.totalExternalWallets}>
            <div class="w3a--w-full w3a--h-12 w3a--animate-pulse w3a--rounded-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700" />
          </Show>
        }
      >
        <button
          type="button"
          class="w3a--flex w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--p-3 w3a--rounded-2xl w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800 hover:w3a--bg-app-gray-200 dark:hover:w3a--bg-app-gray-600"
          onClick={handleMoreWallets}
        >
          <img src={getIcons(props.isDark ? "view-dark" : "view-light")} alt="view" height="24" width="24" />
          <p class="w3a--text-base w3a--font-normal w3a--text-app-gray-700 dark:w3a--text-app-white">More Wallets</p>
          <span
            class="w3a--inline-flex w3a--items-center w3a--rounded-full w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--bg-app-primary-100 w3a--text-app-primary-800 
        dark:w3a--bg-transparent dark:w3a--text-app-primary-400 dark:w3a--border dark:w3a--border-app-primary-400"
          >
            {props.totalExternalWallets - props.initialWalletCount}
          </span>
        </button>
      </Show>
    </>
  );
};

export default ConnectWalletList;
