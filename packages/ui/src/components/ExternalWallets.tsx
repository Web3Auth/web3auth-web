import { BaseAdapterConfig, ChainNamespaceType, log, WALLET_ADAPTERS, WalletRegistry } from "@web3auth/base";
import bowser from "bowser";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExternalButton, MODAL_STATUS, ModalStatusType } from "../interfaces";
import i18n from "../localeImport";
import Button from "./Button";
import ExternalWalletDetail from "./ExternalWallet/ExternalWalletDetail";
import ExternalWalletHeader from "./ExternalWallet/ExternalWalletHeader";
import Image from "./Image";
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
    walletRegistry = {},
  } = props;
  const [externalButtons, setExternalButtons] = useState<ExternalButton[]>([]);
  const [totalExternalWallets, setTotalExternalWallets] = useState<number>(0);
  const [selectedButton, setSelectedButton] = useState<ExternalButton>(null);
  const [walletSearch, setWalletSearch] = useState<string>("");
  const [t] = useTranslation(undefined, { i18n });

  const [walletConnectSupported] = useMemo(() => {
    if (!config) return [true];
    return [Object.keys(config).some((adapter) => adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2)];
  }, [config]);

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
  }, [config, handleExternalWalletClick, walletConnectUri, deviceDetails]);

  useEffect(() => {
    const buttons: ExternalButton[] = Object.keys(walletRegistry)
      .map((wallet): ExternalButton => {
        const walletRegistryItem = walletRegistry[wallet];
        let href = "";
        if (deviceDetails.platform === bowser.PLATFORMS_MAP.mobile && walletConnectUri) {
          const universalLink = walletRegistryItem?.mobile?.universal;
          const deepLink = walletRegistryItem?.mobile?.native;
          href = universalLink || deepLink ? formatIOSMobile({ uri: walletConnectUri, universalLink, deepLink }) : walletConnectUri;
        }
        return {
          name: wallet,
          displayName: walletRegistryItem.name,
          href,
          hasInjectedWallet: Object.keys(config).some((adapter) => adapter === wallet),
          hasWalletConnect:
            Object.keys(config).some((adapter) => adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) &&
            walletRegistryItem.walletConnect?.sdks?.includes("sign_v2"),
          hasInstallLinks: Object.keys(walletRegistryItem.app || {}).length > 0,
          walletRegistryItem,
        };
      })
      .filter((button) => {
        if (!button.hasInjectedWallet && !button.hasWalletConnect && !button.hasInstallLinks) return false;
        const walletRegistryItem = walletRegistry[button.name];
        const chainNamespaces = new Set(walletRegistryItem.chains?.map((chain) => chain.split(":")[0]));
        if (!chainNamespaces.has(chainNamespace)) return false;
        return true;
      });
    setTotalExternalWallets(buttons.length);
    // prioritize wallet that has injected wallet
    buttons.sort((a, b) => {
      if (a.hasInjectedWallet && !b.hasInjectedWallet) return -1;
      if (!a.hasInjectedWallet && b.hasInjectedWallet) return 1;
      return 0;
    });
    const filteredButtons = buttons
      .filter((button) => {
        if (!walletSearch) return true;
        return button.displayName.toLowerCase().includes(walletSearch.toLowerCase());
      })
      .slice(0, 15); // show at most 15 wallets
    setExternalButtons(filteredButtons);
  }, [config, deviceDetails, walletConnectUri, walletRegistry, walletSearch, chainNamespace]);

  const handleWalletClick = (button: ExternalButton) => {
    if (deviceDetails.platform === "desktop") {
      // if has injected wallet, connect to injected wallet
      if (button.hasInjectedWallet) {
        handleExternalWalletClick({ adapter: button.name });
      } else {
        // else, show wallet detail
        setSelectedButton(button);
      }
    }
  };

  return (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-container w3ajs-external-container">
        {/* Loader */}
        {deviceDetails.platform !== "desktop" && walletConnectSupported && !walletConnectUri && (
          <Loader modalStatus={MODAL_STATUS.CONNECTING} canEmit={false} />
        )}
        {modalStatus === MODAL_STATUS.INITIALIZED &&
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
              <div className="pt-4 mb-4">
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

              {/* Wallet List */}
              {externalButtons.length === 0 && (
                <div className="w-full text-center text-app-gray-400 dark:text-app-gray-500 py-6 flex justify-center items-center">
                  {t("modal.external.no-wallets-found")}
                </div>
              )}
              <ul className="w3a-adapter-list w3ajs-wallet-adapters">
                {externalButtons.map((button) => {
                  const providerIcon = (
                    <Image
                      imageId={`login-${button.name}`}
                      hoverImageId={`login-${button.name}`}
                      fallbackImageId="wallet"
                      height="30"
                      width="30"
                      isButton
                    />
                  );
                  const label = <p className="ml-2 text-left">{config[button.name]?.label || button.displayName}</p>;

                  return (
                    <li className="w3a-adapter-item w3a-adapter-item--full" key={button.name}>
                      {deviceDetails.platform === "desktop" ? (
                        <Button
                          variant="tertiary"
                          type="button"
                          onClick={() => handleWalletClick(button)}
                          className="w-full rounded-xl size-xl flex !justify-between items-center !bg-app-gray-100 hover:!bg-app-gray-200 !px-2"
                          title={config[button.name]?.label || button.name}
                        >
                          <div className="flex items-center">
                            {providerIcon} {label}
                          </div>
                          {button.hasInjectedWallet && (
                            <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium bg-app-primary-100 text-app-primary-800">
                              {t("modal.external.installed")}
                            </span>
                          )}
                        </Button>
                      ) : (
                        <a href={button.href} target="_blank" className="w-full" rel="noreferrer noopener">
                          <Button
                            variant="tertiary"
                            type="button"
                            onClick={() => handleWalletClick(button)}
                            className="w-full rounded-xl size-xl flex !justify-start items-center !bg-app-gray-100 hover:!bg-app-gray-200 !px-2"
                            title={config[button.name]?.label || button.name}
                          >
                            {providerIcon} {label}
                          </Button>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            // Wallet Detail
            <ExternalWalletDetail
              connectButton={selectedButton}
              goBack={() => setSelectedButton(null)}
              walletConnectUri={walletConnectUri}
              closeModal={closeModal}
            />
          ))}
      </div>
    </div>
  );
}
