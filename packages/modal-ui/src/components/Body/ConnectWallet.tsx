import { BaseAdapterConfig, ChainNamespaceType, log, WALLET_ADAPTERS, WalletRegistry, WalletRegistryItem } from "@web3auth/base/src";
import bowser from "bowser";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";

import { ExternalButton, ModalStatusType } from "../../interfaces";
import { WalletButton } from "../WalletButton";
export interface ConnectWalletProps {
  onBackClick?: (flag: boolean) => void;
  handleExternalWalletClick: (params: { adapter: string }) => void;
  config: Record<string, BaseAdapterConfig>;
  walletConnectUri: string | undefined;
  showBackButton: boolean;
  modalStatus: ModalStatusType;
  chainNamespace: ChainNamespaceType;
  walletRegistry?: WalletRegistry;
}

// const WALLET_LIST = ['Metamask', 'Ronin Wallet', 'Phantom', 'Rainbow', 'Trust Wallet', 'Coinbase Wallet', 'Uniswap', 'Metamask', 'Ronin Wallet', 'Phantom', 'Rainbow', 'Trust Wallet', 'Coinbase Wallet', 'Uniswap', 'Metamask', 'Ronin Wallet', 'Phantom', 'Rainbow', 'Trust Wallet', 'Coinbase Wallet', 'Uniswap']

const PAGES = {
  CONNECT_WALLET: "Connect Wallet",
  SELECTED_WALLET: "Selected Wallet",
};

type os = "iOS" | "Android";
type platform = "mobile" | "desktop" | "tablet";
type browser = "chrome" | "firefox" | "edge" | "brave" | "safari";

const ConnectWallet = (props: ConnectWalletProps) => {
  const [currentPage, setCurrentPage] = createSignal(PAGES.CONNECT_WALLET);
  const [selectedWallet, setSelectedWallet] = createSignal(false);
  const [externalButtons, setExternalButtons] = createSignal<ExternalButton[]>([]);
  const [totalExternalWallets, setTotalExternalWallets] = createSignal<number>(0);
  // const [selectedButton, setSelectedButton] = createSignal<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = createSignal<string>("");

  const handleBack = () => {
    if (!selectedWallet() && currentPage() === PAGES.CONNECT_WALLET && props.onBackClick) {
      props.onBackClick(false);
    }

    if (selectedWallet) {
      setCurrentPage(PAGES.CONNECT_WALLET);
      setSelectedWallet(false);
    }
  };

  const walletDiscoverySupported = createMemo(() => {
    const supported =
      props.walletRegistry && Object.keys(props.walletRegistry.default || {}).length > 0 && Object.keys(props.walletRegistry.others || {}).length > 0;
    return supported;
  });

  const deviceDetails = createMemo<{ platform: platform; os: os; browser: browser }>(() => {
    const browser = bowser.getParser(window.navigator.userAgent);
    return {
      platform: browser.getPlatformType() as platform,
      os: browser.getOSName() as os,
      browser: browser.getBrowserName().toLowerCase() as browser,
    };
  });

  const handleWalletSearch = (e: InputEvent) => {
    setWalletSearch((e.target as HTMLInputElement).value);
  };

  const adapterVisibilityMap = createMemo(() => {
    const canShowMap: Record<string, boolean> = {};

    Object.keys(props.config).forEach((adapter) => {
      const adapterConfig = props.config[adapter];

      if (!adapterConfig.showOnModal) {
        canShowMap[adapter] = false;
        return;
      }

      if (deviceDetails().platform === "desktop" && adapterConfig.showOnDesktop) {
        canShowMap[adapter] = true;
        return;
      }

      if ((deviceDetails().platform === "mobile" || deviceDetails().platform === "tablet") && adapterConfig.showOnMobile) {
        canShowMap[adapter] = true;
        return;
      }

      canShowMap[adapter] = false;
    });

    log.debug("adapter visibility map", canShowMap);
    return canShowMap;
  });

  createEffect(() => {
    log.debug("loaded external wallets", props.config, props.walletConnectUri);
    const wcAvailable = (props.config[WALLET_ADAPTERS.WALLET_CONNECT_V2]?.showOnModal || false) !== false;
    if (wcAvailable && !props.walletConnectUri) {
      props.handleExternalWalletClick({ adapter: WALLET_ADAPTERS.WALLET_CONNECT_V2 });
    }
  });

  createEffect(() => {
    if (walletDiscoverySupported()) {
      const isWalletConnectAdapterIncluded = Object.keys(props.config).some((adapter) => adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2);
      const defaultButtonKeys = new Set(Object.keys(props.walletRegistry.default));

      const generateWalletButtons = (wallets: Record<string, WalletRegistryItem>): ExternalButton[] => {
        return Object.keys(wallets).reduce((acc, wallet) => {
          if (adapterVisibilityMap()[wallet] === false) return acc;

          const walletRegistryItem: WalletRegistryItem = wallets[wallet];
          let href = "";
          if (deviceDetails().platform === bowser.PLATFORMS_MAP.mobile) {
            const universalLink = walletRegistryItem?.mobile?.universal;
            const deepLink = walletRegistryItem?.mobile?.native;
            href = universalLink || deepLink;
          }

          const button: ExternalButton = {
            name: wallet,
            displayName: walletRegistryItem.name,
            href,
            hasInjectedWallet: props.config[wallet]?.isInjected || false,
            hasWalletConnect: isWalletConnectAdapterIncluded && walletRegistryItem.walletConnect?.sdks?.includes("sign_v2"),
            hasInstallLinks: Object.keys(walletRegistryItem.app || {}).length > 0,
            walletRegistryItem,
            imgExtension: walletRegistryItem.imgExtension || "svg",
          };

          if (!button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks) return acc;

          const chainNamespaces = new Set(walletRegistryItem.chains?.map((chain) => chain.split(":")[0]));
          const injectedChainNamespaces = new Set(walletRegistryItem.injected?.map((injected) => injected.namespace));
          if (!chainNamespaces.has(props.chainNamespace) && !injectedChainNamespaces.has(props.chainNamespace)) return acc;

          acc.push(button);
          return acc;
        }, [] as ExternalButton[]);
      };

      // Generate buttons for default and other wallets
      const defaultButtons = generateWalletButtons(props.walletRegistry.default);
      const otherButtons = generateWalletButtons(props.walletRegistry.others);

      // Generate custom adapter buttons
      const customAdapterButtons: ExternalButton[] = Object.keys(props.config).reduce((acc, adapter) => {
        if (![WALLET_ADAPTERS.WALLET_CONNECT_V2].includes(adapter) && !props.config[adapter].isInjected && adapterVisibilityMap()[adapter]) {
          log.debug("custom adapter", adapter, props.config[adapter]);
          acc.push({
            name: adapter,
            displayName: props.config[adapter].label || adapter,
            hasInjectedWallet: false,
            hasWalletConnect: false,
            hasInstallLinks: false,
          });
        }
        return acc;
      }, [] as ExternalButton[]);

      const allButtons = [...defaultButtons, ...otherButtons];

      // Filter and set external buttons based on search input
      if (walletSearch()) {
        const filteredList = allButtons
          .concat(customAdapterButtons)
          .filter((button) => button.name.toLowerCase().includes(walletSearch().toLowerCase()));

        log.debug("filteredLists", filteredList);
        setExternalButtons(filteredList);
      } else {
        const sortedButtons = [
          ...allButtons.filter((button) => button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
          ...customAdapterButtons,
          ...allButtons.filter((button) => !button.hasInjectedWallet && defaultButtonKeys.has(button.name)),
        ];
        setExternalButtons(sortedButtons);
      }

      setTotalExternalWallets(allButtons.length + customAdapterButtons.length);

      log.debug("external buttons", allButtons);
    } else {
      // Move buttons outside the effect
      const buttons = createMemo(() => {
        const visibilityMap = adapterVisibilityMap();
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

      // Use buttons() directly in the effect
      createEffect(() => {
        setExternalButtons(buttons());
        setTotalExternalWallets(buttons().length);
      });
    }
  });

  const handleWalletClick = (button: ExternalButton) => {
    // if has injected wallet, connect to injected wallet
    // if doesn't have wallet connect & doesn't have install links, must be a custom adapter
    if (button.hasInjectedWallet || (!button.hasWalletConnect && !button.hasInstallLinks)) {
      props.handleExternalWalletClick({ adapter: button.name });
    } else {
      // else, show wallet detail
      // setSelectedButton(button);
      setSelectedWallet(true);
      setCurrentPage(PAGES.SELECTED_WALLET);
    }
  };

  return (
    <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--flex-1 w3a--relative">
      <div class="w3a--flex w3a--items-center w3a--justify-between">
        <figure class="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--bg-app-gray-200 w3a--cursor-pointer" onClick={handleBack} />
        <p class="w3a--text-base w3a--font-medium w3a--text-app-gray-900">{currentPage()}</p>
        <div class="w3a--w-5 w3a--h-5" />
      </div>

      {!selectedWallet() ? (
        <div class="w3a--contents">
          <Show when={totalExternalWallets() > 15}>
            <input
              type="text"
              value={walletSearch()}
              onInput={handleWalletSearch}
              onFocus={(e) => {
                e.target.placeholder = "";
              }}
              onBlur={(e) => {
                e.target.placeholder = `modal.external.search-wallet, ${totalExternalWallets()}`;
              }}
              placeholder="Search through wallets..."
              class="w3a--w-full w3a--px-4 w3a--py-2.5 w3a--border w3a--border-app-gray-300 w3a--bg-app-gray-50 placeholder:w3a--text-app-gray-400 placeholder:w3a--text-sm placeholder:w3a--font-normal w3a--rounded-full"
            />
          </Show>
          <ul class="w3a--flex w3a--flex-col w3a--gap-y-2 w3a--h-[calc(100dvh_-_240px)] w3a--overflow-y-auto">
            <Show
              when={externalButtons.length !== 0}
              fallback={
                <div class="w3a--w-full w3a--text-center w3a--text-app-gray-400 dark:w3a--text-app-gray-500 w3a--py-6 w3a--flex w3a--justify-center w3a--items-center">
                  {"modal.external.no-wallets-found"}
                </div>
              }
            >
              <For each={externalButtons()}>
                {(button) => (
                  <WalletButton
                    label={button.displayName}
                    onClick={() => handleWalletClick(button)}
                    button={button}
                    deviceDetails={deviceDetails()}
                    walletConnectUri={props.walletConnectUri}
                  />
                )}
              </For>
            </Show>
          </ul>
        </div>
      ) : (
        <div class="w3a--contents">
          <div class="w3a--bg-app-gray-200 w3a--rounded-lg w3a--h-[320px] w3a--w-[320px] w3a--mx-auto" />
          <p class="w3a--text-center w3a--text-sm w3a--text-app-gray-500 w3a--font-normal">
            Scan with a WalletConnect-supported wallet or click the QR code to copy to your clipboard.
          </p>
          <div class="w3a--flex w3a--items-center w3a--justify-between w3a--w-full w3a--mt-auto w3a--bg-app-gray-50 w3a--rounded-xl w3a--p-3">
            <p class="w3a--text-sm w3a--text-app-gray-900">Don't have Trust Wallet?</p>
            <button class="w3a--appearance-none w3a--border w3a--border-app-gray-900 w3a--text-xs w3a--text-app-gray-900 w3a--rounded-full w3a--px-2 w3a--py-2">
              Get Wallet
            </button>
          </div>
        </div>
      )}

      {/* <div class="absolute bottom-0 left-0 bg-app-white rounded-lg p-6 w-full flex flex-col gap-y-2 shadow-sm border border-app-gray-100">
        <div class="flex items-center gap-x-2 w-full bg-app-gray-100 px-4 py-2 rounded-full">
          <figure class="w-5 h-5 rounded-full bg-app-gray-200 cursor-pointer"></figure>
          <p class="text-sm font-medium text-app-gray-900">Install Chrome</p>
        </div>
        <div class="flex items-center gap-x-2 w-full bg-app-gray-100 px-4 py-2 rounded-full">
          <figure class="w-5 h-5 rounded-full bg-app-gray-200 cursor-pointer"></figure>
          <p class="text-sm font-medium text-app-gray-900">Install Chrome</p>
        </div>
        <div class="flex items-center gap-x-2 w-full bg-app-gray-100 px-4 py-2 rounded-full">
          <figure class="w-5 h-5 rounded-full bg-app-gray-200 cursor-pointer"></figure>
          <p class="text-sm font-medium text-app-gray-900">Install Chrome</p>
        </div>
      </div> */}
    </div>
  );
};

export default ConnectWallet;
