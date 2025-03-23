import { BaseConnectorConfig, ChainNamespaceType, log, WALLET_CONNECTORS, WalletRegistry, WalletRegistryItem } from "@web3auth/no-modal";
import bowser from "bowser";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExternalButton, ExternalWalletEventType, MODAL_STATUS, ModalStatusType } from "../interfaces";
import i18n from "../localeImport";
import ExternalWalletButton from "./ExternalWallet/ExternalWalletButton";
import ExternalWalletDetail from "./ExternalWallet/ExternalWalletDetails";
import ExternalWalletHeader from "./ExternalWallet/ExternalWalletHeader";
import Loader from "./Loader";

interface ExternalWalletsProps {
  hideExternalWallets: () => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  closeModal: () => void;
  config: Record<string, BaseConnectorConfig>;
  walletConnectUri: string | undefined;
  showBackButton: boolean;
  modalStatus: ModalStatusType;
  chainNamespaces: ChainNamespaceType[];
  walletRegistry?: WalletRegistry;
}

type os = "iOS" | "Android";
type platform = "mobile" | "desktop" | "tablet";
type browser = "chrome" | "firefox" | "edge" | "brave" | "safari";

function formatIOSMobile(params: { uri: string; link?: string }) {
  const encodedUri: string = encodeURIComponent(params.uri);
  if (params.link.startsWith("http")) return `${params.link}/wc?uri=${encodedUri}`;
  if (params.link) return `${params.link}wc?uri=${encodedUri}`;
  return "";
}

export default function ExternalWallets(props: ExternalWalletsProps) {
  const {
    hideExternalWallets,
    handleExternalWalletClick,
    closeModal,
    config = {},
    walletConnectUri,
    showBackButton,
    modalStatus,
    chainNamespaces,
    walletRegistry,
  } = props;
  const [externalButtons, setExternalButtons] = useState<ExternalButton[]>([]);
  const [totalExternalWallets, setTotalExternalWallets] = useState<number>(0);
  const [selectedButton, setSelectedButton] = useState<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = useState<string>("");
  const [t] = useTranslation(undefined, { i18n });

  const walletDiscoverySupported = useMemo(() => {
    const supported = walletRegistry && Object.keys(walletRegistry.default).length > 0 && Object.keys(walletRegistry.others).length > 0;
    return supported;
  }, [walletRegistry]);

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

  const adapterVisibilityMap = useMemo(() => {
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
    return canShowMap;
  }, [config, deviceDetails.platform]);

  useEffect(() => {
    log.debug("loaded external wallets", config, walletConnectUri);
    const wcAvailable = (config[WALLET_CONNECTORS.WALLET_CONNECT_V2]?.showOnModal || false) !== false;
    if (wcAvailable && !walletConnectUri) {
      handleExternalWalletClick({ connector: WALLET_CONNECTORS.WALLET_CONNECT_V2 });
    }
  }, [config, handleExternalWalletClick, walletConnectUri]);

  useEffect(() => {
    if (walletDiscoverySupported) {
      const isWalletConnectAdapterIncluded = Object.keys(config).some((adapter) => adapter === WALLET_CONNECTORS.WALLET_CONNECT_V2);
      const defaultButtonKeys = new Set(Object.keys(walletRegistry.default));

      const generateWalletButtons = (wallets: Record<string, WalletRegistryItem>): ExternalButton[] => {
        return Object.keys(wallets).reduce((acc, wallet) => {
          if (adapterVisibilityMap[wallet] === false) return acc;
          if (wallet === "metamask") return acc;

          const walletRegistryItem: WalletRegistryItem = wallets[wallet];
          let href = "";
          if (deviceDetails.platform === bowser.PLATFORMS_MAP.mobile) {
            const universalLink = walletRegistryItem?.mobile?.universal;
            const deepLink = walletRegistryItem?.mobile?.native;
            href = universalLink || deepLink;
          }

          const registryNamespaces = new Set(walletRegistryItem.chains?.map((chain) => chain.split(":")[0]));
          const injectedChainNamespaces = new Set(walletRegistryItem.injected?.map((injected) => injected.namespace));
          const availableChainNamespaces = chainNamespaces.filter((x) => registryNamespaces.has(x) || injectedChainNamespaces.has(x));

          const button: ExternalButton = {
            name: wallet,
            displayName: walletRegistryItem.name,
            href,
            hasInjectedWallet: config[wallet]?.isInjected || false,
            hasWalletConnect: isWalletConnectAdapterIncluded && walletRegistryItem.walletConnect?.sdks?.includes("sign_v2"),
            hasInstallLinks: Object.keys(walletRegistryItem.app || {}).length > 0,
            walletRegistryItem,
            imgExtension: walletRegistryItem.imgExtension || "svg",
            chainNamespaces: availableChainNamespaces,
          };
          // const isBrowserExtensionAvailable = walletRegistryItem.app?.chrome || walletRegistryItem.app?.firefox || walletRegistryItem.app?.edge;
          if (!button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks) return acc;
          if (availableChainNamespaces.length === 0) return acc;

          acc.push(button);
          return acc;
        }, [] as ExternalButton[]);
      };

      // Generate buttons for default and other wallets
      const defaultButtons = generateWalletButtons(walletRegistry.default);
      const otherButtons = generateWalletButtons(walletRegistry.others);

      // Generate custom adapter buttons
      const customAdapterButtons: ExternalButton[] = Object.keys(config).reduce((acc, adapter) => {
        if (![WALLET_CONNECTORS.WALLET_CONNECT_V2].includes(adapter) && !config[adapter].isInjected && adapterVisibilityMap[adapter]) {
          log.debug("custom adapter", adapter, config[adapter]);
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
        const filteredList = allButtons
          .concat(customAdapterButtons)
          .filter((button) => button.name.toLowerCase().includes(walletSearch.toLowerCase()));

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
      const buttons: ExternalButton[] = Object.keys(config).reduce((acc, adapter) => {
        log.debug("external buttons", adapter, adapterVisibilityMap[adapter]);
        if (![WALLET_CONNECTORS.WALLET_CONNECT_V2].includes(adapter) && adapterVisibilityMap[adapter]) {
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
      setTotalExternalWallets(buttons.length);
    }
  }, [config, deviceDetails, adapterVisibilityMap, walletRegistry, walletSearch, chainNamespaces, walletDiscoverySupported]);

  const handleWalletClick = (button: ExternalButton) => {
    // if has injected wallet and single chain namespace, connect to injected wallet
    const isInjectedConnectorAndSingleChainNamespace = button.hasInjectedWallet && button.chainNamespaces?.length === 1;
    // if doesn't have wallet connect & doesn't have install links, must be a custom connector
    const isCustomConnector = !button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks;
    if (isInjectedConnectorAndSingleChainNamespace || isCustomConnector) {
      handleExternalWalletClick({ connector: button.name });
    } else {
      setSelectedButton(button);
    }
  };

  return (
    <div className={`w3ajs-external-wallet w3a-group ${totalExternalWallets === 0 ? "w3a-group-loader-height" : ""}`}>
      <div className="w3a-external-container w3ajs-external-container">
        {/* Loader */}
        {totalExternalWallets === 0 ? (
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
              {totalExternalWallets > 15 && (
                <div className="w3a--py-4">
                  <input
                    className="w3a--w-full w3a-text-field"
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
                <div className="w3a--w-full w3a--text-center w3a--text-app-gray-400 dark:w3a--text-app-gray-500 w3a--py-6 w3a--flex w3a--justify-center w3a--items-center">
                  {t("modal.external.no-wallets-found")}
                </div>
              ) : (
                <div className={`w3a-adapter-list-container ${totalExternalWallets < 15 ? "w3a--py-4" : ""}`}>
                  <ul className="w3a-adapter-list w3ajs-wallet-adapters">
                    {externalButtons.map((button) => {
                      return (
                        <li className="w3a-adapter-item w3a-adapter-item--full" key={button.name + button.displayName}>
                          {deviceDetails.platform === "desktop" && <ExternalWalletButton button={button} handleWalletClick={handleWalletClick} />}
                          {deviceDetails.platform !== "desktop" &&
                            (button.href && button.hasWalletConnect && !button.hasInjectedWallet ? (
                              <a
                                href={button.href ? formatIOSMobile({ uri: walletConnectUri, link: button.href }) : walletConnectUri}
                                target="_blank"
                                className="w3a--w-full"
                                rel="noreferrer noopener"
                              >
                                <ExternalWalletButton button={button} handleWalletClick={handleWalletClick} />
                              </a>
                            ) : (
                              <ExternalWalletButton button={button} handleWalletClick={handleWalletClick} />
                            ))}
                        </li>
                      );
                    })}
                    {totalExternalWallets > 10 && !walletSearch && (
                      <li className="w3a--flex w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-0.5 w3a--my-4 w3a--w-full w3a--mx-auto w3a-adapter-item--full">
                        <p className="w3a--text-xs w3a--text-app-gray-500 dark:w3a--text-app-gray-400">{t("modal.external.search-text")}</p>
                        <p className="w3a--text-xs w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
                          {t("modal.external.search-subtext")}
                        </p>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : (
            // Wallet Detail
            <ExternalWalletDetail
              connectButton={selectedButton}
              goBack={() => setSelectedButton(null)}
              walletConnectUri={walletConnectUri}
              closeModal={closeModal}
              handleExternalWalletClick={handleExternalWalletClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
