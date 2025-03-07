import { BaseAdapterConfig, ChainNamespaceType, WALLET_ADAPTERS, WalletRegistry } from "@web3auth/no-modal";
import { createEffect, createMemo, createSignal, Show } from "solid-js";

import { CHAIN_LIST, CONNECT_WALLET_PAGES } from "../../constants";
import { browser, ExternalButton, ModalStatusType, os, platform } from "../../interfaces";
import { ChainFilters } from "../ChainFilters";
import { ConnectSearchWallets } from "../ConnectSearchWallets";
import { ConnectWalletHeader } from "../ConnectWalletHeader";
import { ConnectWalletList } from "../ConnectWalletList";
import { ConnectWalletQrCode } from "../ConnectWalletQrCode";

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
  const [currentPage, setCurrentPage] = createSignal(CONNECT_WALLET_PAGES.CONNECT_WALLET);
  const [selectedWallet, setSelectedWallet] = createSignal(false);
  const [externalButtons, setExternalButtons] = createSignal<ExternalButton[]>([]);
  const [totalExternalWallets, setTotalExternalWallets] = createSignal<number>(0);
  const [selectedButton, setSelectedButton] = createSignal<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(true);
  const [selectedChain, setSelectedChain] = createSignal<string>("all");
  const [initialWalletCount, setInitialWalletCount] = createSignal<number>(0);

  const handleBack = () => {
    if (!selectedWallet() && currentPage() === CONNECT_WALLET_PAGES.CONNECT_WALLET && props.onBackClick) {
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
      setInitialWalletCount(sortedButtons().length);
      setTotalExternalWallets(props.totalExternalWallets);
    } else {
      setExternalButtons(visibleButtons());
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
    setInitialWalletCount((prev) => prev + 10);
    const allButtons = [...props.allExternalButtons, ...props.customAdapterButtons];
    const buttons = allButtons.slice(initialWalletCount(), initialWalletCount() + 10);
    setExternalButtons((prev) => [...prev, ...buttons]);
  };

  return (
    <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--flex-1 w3a--relative">
      {/* Header */}
      <ConnectWalletHeader onBackClick={handleBack} currentPage={currentPage()} selectedButton={selectedButton()} />
      {/* Body */}
      <Show
        when={selectedWallet()}
        fallback={
          <div class="w3a--flex w3a--flex-col w3a--gap-y-2">
            {/* Chain Filters */}
            <ChainFilters
              isDark={props.isDark}
              isLoading={isLoading()}
              selectedChain={selectedChain()}
              setSelectedChain={setSelectedChain}
              chains={CHAIN_LIST}
            />
            {/* Search Input */}
            <ConnectSearchWallets
              totalExternalWallets={totalExternalWallets()}
              isLoading={isLoading()}
              walletSearch={walletSearch()}
              handleWalletSearch={handleWalletSearch}
            />
            {/* Wallet List */}
            <ConnectWalletList
              externalButtons={externalButtons()}
              isLoading={isLoading()}
              totalExternalWallets={totalExternalWallets()}
              initialWalletCount={initialWalletCount()}
              handleWalletClick={handleWalletClick}
              handleMoreWallets={handleMoreWallets}
              isDark={props.isDark}
              deviceDetails={props.deviceDetails}
              walletConnectUri={props.walletConnectUri}
            />
          </div>
        }
      >
        {/* QR Code */}
        <ConnectWalletQrCode
          walletConnectUri={props.walletConnectUri}
          isDark={props.isDark}
          selectedButton={selectedButton()}
          setBodyState={props.setBodyState}
          bodyState={props.bodyState}
        />
      </Show>
    </div>
  );
};

export default ConnectWallet;
