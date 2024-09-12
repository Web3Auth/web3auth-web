import { BaseAdapterConfig, ChainNamespaceType, log, WALLET_ADAPTERS, WalletRegistry, WalletRegistryItem } from "@web3auth/base";
import bowser from "bowser";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExternalButton, MODAL_STATUS, ModalStatusType } from "../interfaces";
import i18n from "../localeImport";
import ExternalWalletButton from "./ExternalWallet/ExternalWalletButton";
import ExternalWalletConnect from "./ExternalWallet/ExternalWalletConnect";
import ExternalWalletHeader from "./ExternalWallet/ExternalWalletHeader";
import Loader from "./Loader";

interface ExternalWalletsProps {
  hideExternalWallets: () => void;
  handleExternalWalletClick: (params: { adapter: string }) => void;
  closeModal: () => void;
  config: Record<string, BaseAdapterConfig>;
  walletConnectUri: string | undefined;
  showBackButton: boolean;
  modalStatus: ModalStatusType;
  chainNamespace: ChainNamespaceType;
  walletRegistry?: WalletRegistry;
}

type os = "iOS" | "Android";
type platform = "mobile" | "desktop" | "tablet";
type browser = "chrome" | "firefox" | "edge" | "brave" | "safari";

function formatIOSMobile(params: { uri: string; universalLink?: string; deepLink?: string }) {
  const encodedUri: string = encodeURIComponent(params.uri);
  if (params.universalLink) return `${params.universalLink}/wc?uri=${encodedUri}`;
  if (params.deepLink) return `${params.deepLink}wc?uri=${encodedUri}`;
  return "";
}

export default function ExternalWallet(props: ExternalWalletsProps) {
  const {
    hideExternalWallets,
    handleExternalWalletClick,
    closeModal,
    config = {},
    walletConnectUri,
    showBackButton,
    modalStatus,
    chainNamespace,
    walletRegistry,
  } = props;
  const [externalButtons, setExternalButtons] = useState<ExternalButton[]>([]);
  const [adapterVisibilityMap, setAdapterVisibilityMap] = useState<Record<string, boolean>>({});
  const [totalExternalWallets, setTotalExternalWallets] = useState<number>(0);
  const [selectedButton, setSelectedButton] = useState<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = useState<string>("");
  const [t] = useTranslation(undefined, { i18n });

  const [isWalletDiscoveryReady, isWalletDiscoveryNotReady] = useMemo(() => {
    const walletConnectSupported = Object.keys(config || {}).some((adapter) => adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2);
    const walletDiscoverySupported = walletRegistry && Object.keys(walletRegistry).length > 0 && walletConnectSupported;
    return [walletDiscoverySupported && walletConnectUri, walletDiscoverySupported && !walletConnectUri];
  }, [config, walletConnectUri, walletRegistry]);

  const deviceDetails = useMemo<{ platform: platform; os: os; browser: browser }>(() => {
    const browser = bowser.getParser(window.navigator.userAgent);
    return {
      platform: browser.getPlatformType() as platform,
      os: browser.getOSName() as os,
      browser: browser.getBrowserName().toLowerCase() as browser,
    };
  }, []);

  const handleWalletSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setWalletSearch(e.target.value);
  };

  useEffect(() => {
    log.debug("loaded external wallets", config, walletConnectUri, deviceDetails.platform);
    const wcAvailable = (config[WALLET_ADAPTERS.WALLET_CONNECT_V2]?.showOnModal || false) !== false;
    if (wcAvailable && !walletConnectUri) {
      handleExternalWalletClick({ adapter: WALLET_ADAPTERS.WALLET_CONNECT_V2 });
    }
    const canShowMap: Record<string, boolean> = {};
    Object.keys(config).forEach((adapter) => {
      const adapterConfig = config[adapter];
      if (!adapterConfig.showOnModal) {
        canShowMap[adapter] = false;
        return;
      }
      if (deviceDetails.platform === "desktop" && adapterConfig.showOnDesktop) {
        canShowMap[adapter] = true;
        return;
      }
      if ((deviceDetails.platform === "mobile" || deviceDetails.platform === "tablet") && adapterConfig.showOnMobile) {
        canShowMap[adapter] = true;
        return;
      }
      canShowMap[adapter] = false;
    });
    log.debug("adapter visibility map", canShowMap);
    setAdapterVisibilityMap(canShowMap);
  }, [config, handleExternalWalletClick, walletConnectUri, deviceDetails]);

  useEffect(() => {
    if (isWalletDiscoveryReady) {
      const isWalletConnectAdapterIncluded = Object.keys(config).some((adapter) => adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2);
      const defaultButtonKeys = new Set(Object.keys(walletRegistry.default));

      const generateWalletButtons = (wallets: Record<string, WalletRegistryItem>): ExternalButton[] => {
        return Object.keys(wallets).reduce((acc, wallet) => {
          if (adapterVisibilityMap[wallet] === false) return acc;

          const walletRegistryItem: WalletRegistryItem = wallets[wallet];
          let href = "";
          if (deviceDetails.platform === bowser.PLATFORMS_MAP.mobile && walletConnectUri) {
            const universalLink = walletRegistryItem?.mobile?.universal;
            const deepLink = walletRegistryItem?.mobile?.native;
            href = universalLink || deepLink ? formatIOSMobile({ uri: walletConnectUri, universalLink, deepLink }) : walletConnectUri;
          }

          const button = {
            name: wallet,
            displayName: walletRegistryItem.name,
            href,
            hasInjectedWallet: config[wallet]?.isInjected || false,
            hasWalletConnect: isWalletConnectAdapterIncluded,
            hasInstallLinks: Object.keys(walletRegistryItem.app || {}).length > 0,
            walletRegistryItem,
          };

          if (!button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks) return acc;

          const chainNamespaces = new Set(walletRegistryItem.chains?.map((chain) => chain.split(":")[0]));
          if (!chainNamespaces.has(chainNamespace)) return acc;

          acc.push(button);
          return acc;
        }, [] as ExternalButton[]);
      };

      // Generate buttons for default and other wallets
      const defaultButtons = generateWalletButtons(walletRegistry.default);
      const otherButtons = generateWalletButtons(walletRegistry.others);

      // Generate custom adapter buttons
      const customAdapterButtons: ExternalButton[] = Object.keys(config).reduce((acc, adapter) => {
        if (![WALLET_ADAPTERS.WALLET_CONNECT_V2].includes(adapter) && !config[adapter].isInjected && adapterVisibilityMap[adapter]) {
          acc.push({
            name: adapter,
            displayName: config[adapter].label || adapter,
            hasInjectedWallet: false,
            hasWalletConnect: false,
            hasInstallLinks: false,
          });
        }
        return acc;
      }, [] as ExternalButton[]);

      const allButtons = [...defaultButtons, ...otherButtons];

      // Filter and set external buttons based on search input
      if (walletSearch) {
        const filteredList = allButtons.filter((button) => button.name.toLowerCase().includes(walletSearch.toLowerCase()));
        setExternalButtons(filteredList);
      } else {
        const sortedButtons = [
          ...allButtons.filter((button) => button.hasInjectedWallet),
          ...customAdapterButtons,
          ...allButtons.filter((button) => !button.hasInjectedWallet),
        ].filter((button) => defaultButtonKeys.has(button.name));
        setExternalButtons(sortedButtons);
      }

      setTotalExternalWallets(allButtons.length + customAdapterButtons.length);

      log.debug("external buttons", allButtons);
    } else {
      const buttons: ExternalButton[] = Object.keys(config).reduce((acc, adapter) => {
        log.debug("external buttons", adapter, adapterVisibilityMap[adapter]);
        if (![WALLET_ADAPTERS.WALLET_CONNECT_V2].includes(adapter) && adapterVisibilityMap[adapter]) {
          acc.push({
            name: adapter,
            displayName: config[adapter].label || adapter,
            hasInjectedWallet: config[adapter].isInjected,
            hasWalletConnect: false,
            hasInstallLinks: false,
          });
        }
        return acc;
      }, [] as ExternalButton[]);
      setExternalButtons(buttons);
    }
  }, [config, deviceDetails, walletConnectUri, adapterVisibilityMap, isWalletDiscoveryReady, walletRegistry, walletSearch, chainNamespace]);

  const handleWalletClick = (button: ExternalButton) => {
    if (deviceDetails.platform === "desktop") {
      // if has injected wallet, connect to injected wallet
      if (!button.hasInjectedWallet && button.hasWalletConnect) {
        // else, show wallet detail
        setSelectedButton(button);
        return;
      }
    }
    handleExternalWalletClick({ adapter: button.name });
  };

  return (
    <div className={`w3ajs-external-wallet w3a-group ${isWalletDiscoveryNotReady ? "w3a-group-loader-height" : ""}`}>
      <div className="w3a-external-container w3ajs-external-container">
        {/* Loader */}
        {isWalletDiscoveryNotReady ? (
          <Loader modalStatus={MODAL_STATUS.CONNECTING} canEmit={false} />
        ) : (
          modalStatus === MODAL_STATUS.INITIALIZED &&
          // All wallets
          (!selectedButton ? (
            <>
              {/* Header */}
              <ExternalWalletHeader
                disableBackButton={!showBackButton}
                title={t("modal.external.connect-wallet")}
                goBack={hideExternalWallets}
                closeModal={closeModal}
              />

              {/* Search */}
              {isWalletDiscoveryReady && (
                <div className="py-4">
                  <input
                    className="w-full w3a-text-field"
                    name="passwordless-input"
                    required
                    value={walletSearch}
                    placeholder={t("modal.external.search-wallet", { count: totalExternalWallets })}
                    onFocus={(e) => {
                      e.target.placeholder = "";
                    }}
                    onBlur={(e) => {
                      e.target.placeholder = t("modal.external.search-wallet", { count: totalExternalWallets });
                    }}
                    onChange={(e) => handleWalletSearch(e)}
                  />
                </div>
              )}

              {/* Wallet List */}
              {externalButtons.length === 0 ? (
                <div className="w-full text-center text-app-gray-400 dark:text-app-gray-500 py-6 flex justify-center items-center">
                  {t("modal.external.no-wallets-found")}
                </div>
              ) : (
                <div className="w3a-adapter-list-container">
                  <ul className="w3a-adapter-list w3ajs-wallet-adapters">
                    {externalButtons.map((button) => {
                      return (
                        <li className="w3a-adapter-item w3a-adapter-item--full" key={button.name}>
                          {deviceDetails.platform === "desktop" ? (
                            <ExternalWalletButton button={button} adapterConfig={config[button.name]} handleWalletClick={handleWalletClick} />
                          ) : (
                            <a href={button.href} target="_blank" className="w-full" rel="noreferrer noopener">
                              <ExternalWalletButton button={button} adapterConfig={config[button.name]} handleWalletClick={handleWalletClick} />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          ) : (
            // Wallet Detail
            <ExternalWalletConnect
              connectButton={selectedButton}
              walletConnectUri={walletConnectUri}
              goBack={() => setSelectedButton(null)}
              closeModal={closeModal}
            />
          ))
        )}
      </div>
    </div>
  );
}
