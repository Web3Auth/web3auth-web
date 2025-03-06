import { BaseAdapterConfig, ChainNamespaceType, log, WALLET_ADAPTERS, WalletRegistry } from "@web3auth/no-modal";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { MaskType, QRCodeCanvas } from "solid-qr-code";

import { CONNECT_WALLET_PAGES } from "../../constants";
import { browser, ExternalButton, ModalStatusType, os, platform } from "../../interfaces";
import { t } from "../../localeImport";
import { cn, getIcons } from "../../utils/common";
import { Image } from "../Image";
import { WalletButton } from "../WalletButton";

export interface ConnectWalletProps {
  isDark: boolean;
  onBackClick?: (flag: boolean) => void;
  handleExternalWalletClick: (params: { adapter: string }) => void;
  config: Record<string, BaseAdapterConfig>;
  walletConnectUri: string | undefined;
  showBackButton: boolean;
  modalStatus: ModalStatusType;
  chainNamespace: ChainNamespaceType;
  walletRegistry?: WalletRegistry;
  appLogo?: string;
  allExternalButtons: ExternalButton[];
  totalExternalWallets: number;
  customAdapterButtons: ExternalButton[];
  adapterVisibilityMap: Record<string, boolean>;
  deviceDetails: { platform: platform; browser: browser; os: os };
  bodyState: {
    showWalletDetails: boolean;
    walletDetails: ExternalButton;
  };
  setBodyState: (state: { showWalletDetails: boolean; walletDetails: ExternalButton }) => void;
  handleWalletDetailsHeight: () => void;
}

const ConnectWallet = (props: ConnectWalletProps) => {
  // const { bodyState, setBodyState } = useContext(BodyContext);
  const [currentPage, setCurrentPage] = createSignal(CONNECT_WALLET_PAGES.CONNECT_WALLET);
  const [selectedWallet, setSelectedWallet] = createSignal(false);
  const [externalButtons, setExternalButtons] = createSignal<ExternalButton[]>([]);
  const [totalExternalWallets, setTotalExternalWallets] = createSignal<number>(0);
  const [selectedButton, setSelectedButton] = createSignal<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(true);
  const [selectedChain, setSelectedChain] = createSignal<"all" | "ethereum" | "polygon" | "solana">("all");
  const [isInputFocused, setIsInputFocused] = createSignal(false);
  const [initialWalletCount, setInitialWalletCount] = createSignal<number>(0);

  const handleBack = () => {
    log.debug("handleBack", selectedWallet(), currentPage());
    if (!selectedWallet() && currentPage() === CONNECT_WALLET_PAGES.CONNECT_WALLET && props.onBackClick) {
      log.debug("handleBack IF");
      props.onBackClick(false);
    }

    if (selectedWallet()) {
      setCurrentPage(CONNECT_WALLET_PAGES.CONNECT_WALLET);
      setSelectedWallet(false);
      props.handleWalletDetailsHeight();
    }
  };

  const walletDiscoverySupported = createMemo(() => {
    const supported =
      props.walletRegistry && Object.keys(props.walletRegistry.default || {}).length > 0 && Object.keys(props.walletRegistry.others || {}).length > 0;
    return supported;
  });

  const filteredButtons = (searchValue: string) => {
    return props.allExternalButtons
      .concat(props.customAdapterButtons)
      .filter((button) => button.name.toLowerCase().includes(searchValue.toLowerCase()));
  };

  const defaultButtonKeys = createMemo(() => new Set(Object.keys(props.walletRegistry.default)));

  const sortedButtons = createMemo(() => {
    log.debug("sortedButtons", props.allExternalButtons);
    return [
      ...props.allExternalButtons.filter((button) => button.hasInjectedWallet && defaultButtonKeys().has(button.name)),
      ...props.customAdapterButtons,
      ...props.allExternalButtons.filter((button) => !button.hasInjectedWallet && defaultButtonKeys().has(button.name)),
    ];
  });

  const visibleButtons = createMemo(() => {
    const visibilityMap = props.adapterVisibilityMap;
    // eslint-disable-next-line solid/reactivity
    return Object.keys(props.config).reduce((acc, adapter) => {
      if (![WALLET_ADAPTERS.WALLET_CONNECT_V2].includes(adapter) && visibilityMap[adapter]) {
        acc.push({
          name: adapter,
          displayName: props.config[adapter].label || adapter,
          hasInjectedWallet: props.config[adapter].isInjected,
          hasWalletConnect: false,
          hasInstallLinks: false,
        });
      }
      return acc;
    }, [] as ExternalButton[]);
  });

  const handleWalletSearch = (e: InputEvent) => {
    const searchValue = (e.target as HTMLInputElement).value;
    log.debug("handleWalletSearch", searchValue);
    setWalletSearch(searchValue);
    if (searchValue) {
      setExternalButtons(filteredButtons(searchValue));
    } else {
      setExternalButtons(sortedButtons());
    }
  };

  createEffect(() => {
    if (walletDiscoverySupported()) {
      setExternalButtons(sortedButtons());
      log.debug("sortedButtons", sortedButtons().length);
      setInitialWalletCount(sortedButtons().length);
      setTotalExternalWallets(props.totalExternalWallets);
    } else {
      setExternalButtons(visibleButtons());
      log.debug("visibleButtons", visibleButtons().length);
      setTotalExternalWallets(visibleButtons().length);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  });

  const handleWalletClick = (button: ExternalButton) => {
    // if has injected wallet, connect to injected wallet
    // if doesn't have wallet connect & doesn't have install links, must be a custom adapter
    if (button.hasInjectedWallet || (!button.hasWalletConnect && !button.hasInstallLinks)) {
      props.handleExternalWalletClick({ adapter: button.name });
    } else if (button.hasWalletConnect) {
      setSelectedButton(button);
      setSelectedWallet(true);
      setCurrentPage(CONNECT_WALLET_PAGES.SELECTED_WALLET);
    } else {
      props.setBodyState({
        ...props.bodyState,
        showWalletDetails: true,
        walletDetails: button,
      });
    }

    props.handleWalletDetailsHeight();
  };

  const handleMoreWallets = () => {
    // setIsLoading(true);
    log.debug("handleMoreWallets", initialWalletCount(), props.allExternalButtons, props.customAdapterButtons);
    setInitialWalletCount((prev) => prev + 10);
    const allButtons = [...props.allExternalButtons, ...props.customAdapterButtons];
    const buttons = allButtons.slice(initialWalletCount(), initialWalletCount() + 10);
    log.debug("buttons", buttons);
    setExternalButtons((prev) => [...prev, ...buttons]);
  };

  return (
    <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--flex-1 w3a--relative">
      <div class="w3a--flex w3a--items-center w3a--justify-between">
        <button
          class="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--cursor-pointer w3a--flex w3a--items-center w3a--justify-center w3a--z-20"
          onClick={handleBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" class="w3a--text-app-gray-900 dark:w3a--text-app-white">
            <path
              fill="currentColor"
              fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <p class="w3a--text-base w3a--font-medium w3a--text-app-gray-900">
          {currentPage() === CONNECT_WALLET_PAGES.SELECTED_WALLET ? selectedButton()?.displayName : currentPage()}
        </p>
        <div class="w3a--w-5 w3a--h-5 w3a--z-[-1]" />
      </div>

      <Show
        when={selectedWallet()}
        fallback={
          <div class="w3a--flex w3a--flex-col w3a--gap-y-2">
            <Show
              when={!isLoading()}
              fallback={
                <div class="w3a--flex w3a--items-center w3a--justify-between w3a--gap-x-2">
                  <div class="w3a--w-[100px] w3a--h-12 w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--animate-pulse" />
                  <div class="w3a--w-12 w3a--h-12 w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--animate-pulse" />
                  <div class="w3a--w-12 w3a--h-12 w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--animate-pulse" />
                  <div class="w3a--w-12 w3a--h-12 w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--animate-pulse" />
                </div>
              }
            >
              <div class="w3a--flex w3a--items-center w3a--justify-between w3a--gap-x-2">
                <button
                  class={cn(
                    "w3a--text-sm w3a--font-medium w3a--px-4 w3a--py-3 w3a--text-app-gray-900 dark:w3a--text-app-white w3a--rounded-2xl w3a--h-12",
                    {
                      "w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800": selectedChain() === "all",
                    }
                  )}
                  onClick={() => setSelectedChain("all")}
                >
                  All Chains
                </button>
                <button
                  class={cn(
                    "w3a--text-sm w3a--font-medium w3a--px-4 w3a--py-3 w3a--text-app-gray-900 dark:w3a--text-app-white w3a--rounded-2xl w3a--w-12 w3a--h-12",
                    {
                      "w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800": selectedChain() === "ethereum",
                    }
                  )}
                  onClick={() => setSelectedChain("ethereum")}
                >
                  <img src={getIcons(props.isDark ? "ethereum-dark" : "ethereum-light")} alt="ethereum" />
                </button>
                <button
                  class={cn(
                    "w3a--text-sm w3a--font-medium w3a--px-4 w3a--py-3 w3a--text-app-gray-900 dark:w3a--text-app-white w3a--rounded-2xl w3a--w-12 w3a--h-12",
                    {
                      "w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800": selectedChain() === "polygon",
                    }
                  )}
                  onClick={() => setSelectedChain("polygon")}
                >
                  <img src={getIcons(props.isDark ? "polygon-dark" : "polygon-light")} alt="polygon" />
                </button>
                <button
                  class={cn(
                    "w3a--text-sm w3a--font-medium w3a--px-4 w3a--py-3 w3a--text-app-gray-900 dark:w3a--text-app-white w3a--rounded-2xl w3a--w-12 w3a--h-12",
                    {
                      "w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800": selectedChain() === "solana",
                    }
                  )}
                  onClick={() => setSelectedChain("solana")}
                >
                  <img src={getIcons(props.isDark ? "solana-dark" : "solana-light")} alt="solana" />
                </button>
              </div>
            </Show>
            <Show
              when={totalExternalWallets() > 15 && !isLoading()}
              fallback={<div class="w3a--w-full w3a--h-[50px] w3a--animate-pulse w3a--rounded-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700" />}
            >
              <input
                type="text"
                value={walletSearch()}
                onInput={handleWalletSearch}
                onFocus={(e) => {
                  e.target.placeholder = "";
                  setIsInputFocused(true);
                }}
                onBlur={(e) => {
                  e.target.placeholder = t("modal.external.search-wallet", { count: `${totalExternalWallets()}` });
                  setIsInputFocused(false);
                }}
                placeholder={
                  isLoading() ? t("modal.external.search-wallet-loading") : t("modal.external.search-wallet", { count: `${totalExternalWallets()}` })
                }
                disabled={isLoading()}
                class={cn(
                  "w3a--input w3a--appearance-none w3a--outline-none active:w3a--outline-none focus:w3a--outline-none w3a--bg-transparent placeholder:w3a--text-app-gray-400 dark:placeholder:w3a--text-app-gray-500 w3a--text-app-gray-900 dark:w3a--text-app-white",
                  isInputFocused() && "!w3a--border-app-primary-600"
                )}
              />
            </Show>
            <ul class={cn("w3a--overflow-y-auto w3a--flex w3a--flex-col w3a--gap-y-2 w3a--h-[calc(100dvh_-_480px)]")}>
              <Show
                when={externalButtons().length > 0}
                fallback={
                  <div class="w3a--w-full w3a--text-center w3a--text-app-gray-400 dark:w3a--text-app-gray-500 w3a--py-6 w3a--flex w3a--justify-center w3a--items-center">
                    {t("modal.external.no-wallets-found")}
                  </div>
                }
              >
                <Show
                  when={!isLoading()}
                  fallback={
                    <div class="w3a--flex w3a--flex-col w3a--gap-y-2 w3a--pr-1.5">
                      <For each={Array(6).fill(0)}>
                        {(_) => (
                          <div class="w3a--w-full w3a--h-12 w3a--animate-pulse w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700" />
                        )}
                      </For>
                    </div>
                  }
                >
                  <div class="w3a--flex w3a--flex-col w3a--gap-y-2 w3a--pr-1.5">
                    <For each={externalButtons()}>
                      {(button) => (
                        <WalletButton
                          label={button.displayName}
                          onClick={() => handleWalletClick(button)}
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
              when={totalExternalWallets() > 15 && !isLoading() && initialWalletCount() < totalExternalWallets()}
              fallback={
                <Show when={initialWalletCount() < totalExternalWallets()}>
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
                  {props.totalExternalWallets - initialWalletCount()}
                </span>
              </button>
            </Show>
          </div>
        }
      >
        <div class="w3a--contents">
          <Show
            when={props.walletConnectUri}
            fallback={
              <div class="w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--animate-pulse w3a--rounded-lg w3a--h-[300px] w3a--w-[300px] w3a--mx-auto w3a--p-2 w3a--flex w3a--items-center w3a--justify-center">
                <Image
                  imageId={`login-${selectedButton().name}`}
                  hoverImageId={`login-${selectedButton().name}`}
                  fallbackImageId="wallet"
                  height="30"
                  width="30"
                  isButton
                  extension={selectedButton().imgExtension}
                />
              </div>
            }
          >
            <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--items-center w3a--justify-center w3a--border w3a--border-app-gray-200 dark:w3a--border-app-gray-700 w3a--rounded-2xl w3a--p-4">
              <div class="w3a--relative w3a--rounded-2xl w3a--h-[300px] w3a--w-[300px] w3a--flex w3a--items-center w3a--justify-center">
                <QRCodeCanvas
                  value={props.walletConnectUri || ""}
                  level="low"
                  backgroundColor="transparent"
                  backgroundAlpha={0}
                  foregroundColor={props.isDark ? "#ffffff" : "#000000"}
                  foregroundAlpha={1}
                  width={300}
                  height={300}
                  x={0}
                  y={0}
                  maskType={MaskType.FLOWER_IN_SQAURE}
                />
                <div class="w3a--absolute w3a--top-[43%] w3a--left-[43%] w3a--transform -translate-y-1/2 w3a--w-10 w3a--h-10 w3a--bg-app-white w3a--rounded-full w3a--flex w3a--items-center w3a--justify-center">
                  <Image
                    imageId={`login-${selectedButton().name}`}
                    hoverImageId={`login-${selectedButton().name}`}
                    fallbackImageId="wallet"
                    height="20"
                    width="20"
                    isButton
                    extension={selectedButton().imgExtension}
                  />
                </div>
              </div>
              <p class="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-300 w3a--font-normal">
                {t("modal.external.walletconnect-copy")}
              </p>
            </div>
          </Show>

          <div
            class="w3a--flex w3a--items-center w3a--justify-between w3a--w-full w3a--text-app-gray-900 w3a--bg-app-gray-50 
      dark:w3a--bg-app-gray-800 dark:w3a--text-app-white w3a--rounded-2xl w3a--px-4 w3a--py-2"
          >
            <p class="w3a--text-sm w3a--text-app-gray-900 dark:w3a--text-app-white">
              {t("modal.external.dont-have")} <span>{selectedButton()?.displayName}</span>?
            </p>
            <button
              class="w3a--appearance-none w3a--border w3a--border-app-gray-400 w3a--text-sm w3a--font-medium w3a--text-app-gray-400 hover:w3a--bg-app-white dark:hover:w3a--bg-app-gray-700 dark:w3a--text-app-gray-300 dark:w3a--border-app-gray-300 w3a--rounded-full w3a--px-3 w3a--py-2 hover:w3a--shadow-2xl"
              onClick={() => {
                props.setBodyState({
                  ...props.bodyState,
                  showWalletDetails: true,
                  walletDetails: selectedButton(),
                });
              }}
            >
              {t("modal.external.get-wallet")}
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ConnectWallet;
