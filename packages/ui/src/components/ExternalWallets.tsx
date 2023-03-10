import { BaseAdapterConfig, IWalletConnectExtensionAdapter, log, WALLET_ADAPTERS } from "@web3auth/base";
import bowser from "bowser";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MODAL_STATUS, ModalStatusType, WALLET_CONNECT_LOGO } from "../interfaces";
import Icon from "./Icon";
import Image from "./Image";
import Loader from "./Loader";
import WalletConnect from "./WalletConnect";

interface ExternalWalletsProps {
  hideExternalWallets: () => void;
  handleExternalWalletClick: (params: { adapter: string }) => void;
  config: Record<string, BaseAdapterConfig>;
  walletConnectUri: string | undefined;
  showBackButton: boolean;
  modalStatus: ModalStatusType;
  wcAdapters: IWalletConnectExtensionAdapter[];
}

type ExternalButton = {
  name: string;
  href?: string;
  logo?: string;
  isLink: boolean;
  block: boolean;
};

interface IMobileRegistryEntry {
  name: string;
  logo: string;
  universalLink: string;
  deepLink: string;
  href: string;
}

type os = "iOS" | "Android";

type platform = "mobile" | "desktop" | "tablet";

function formatIOSMobile(params: { uri: string; universalLink?: string; deepLink?: string }) {
  const encodedUri: string = encodeURIComponent(params.uri);
  if (params.universalLink) {
    return `${params.universalLink}/wc?uri=${encodedUri}`;
  }
  if (params.deepLink) {
    return `${params.deepLink}${params.deepLink.endsWith(":") ? "//" : "/"}wc?uri=${encodedUri}`;
  }
  return "";
}

function formatMobileRegistryEntry(
  entry: IWalletConnectExtensionAdapter,
  walletConnectUri: string,
  os: os,
  platform: platform = "mobile"
): IMobileRegistryEntry {
  const universalLink = entry[platform].universal || "";
  const deepLink = entry[platform].native || "";
  return {
    name: entry.name || "",
    logo: entry.logo || "",
    universalLink,
    deepLink,
    href: os === bowser.OS_MAP.iOS ? formatIOSMobile({ uri: walletConnectUri, universalLink, deepLink }) : walletConnectUri,
  };
}

function formatMobileRegistry(
  registry: IWalletConnectExtensionAdapter[],
  walletConnectUri: string,
  os: os,
  platform: platform = "mobile"
): IMobileRegistryEntry[] {
  return Object.values<IWalletConnectExtensionAdapter>(registry)
    .filter((entry) => !!entry[platform].universal || !!entry[platform].native)
    .map((entry) => formatMobileRegistryEntry(entry, walletConnectUri, os, platform));
}

export default function ExternalWallet(props: ExternalWalletsProps) {
  const { hideExternalWallets, handleExternalWalletClick, config = {}, walletConnectUri, showBackButton, modalStatus, wcAdapters } = props;
  const [isLoaded, setIsLoaded] = useState(true);
  const [adapterVisibilityMap, setAdapterVisibilityMap] = useState<Record<string, boolean>>({});
  const [externalButtons, setExternalButtons] = useState<ExternalButton[]>([]);

  const deviceType = useMemo<platform>(() => {
    const browser = bowser.getParser(window.navigator.userAgent);
    return browser.getPlatformType() as platform;
  }, []);

  const deviceDetails = useMemo<{ platform: platform; os: os }>(() => {
    const browser = bowser.getParser(window.navigator.userAgent);
    return { platform: browser.getPlatformType() as platform, os: browser.getOSName() as os };
  }, []);

  const [t] = useTranslation();

  useEffect(() => {
    log.debug("loaded external wallets", config, walletConnectUri, deviceType);
    const walletConnectAdapterName = config[WALLET_ADAPTERS.WALLET_CONNECT_V1]?.showOnModal
      ? WALLET_ADAPTERS.WALLET_CONNECT_V1
      : WALLET_ADAPTERS.WALLET_CONNECT_V2;
    const wcAvailable = (config[walletConnectAdapterName]?.showOnModal || false) !== false;
    if (wcAvailable && !walletConnectUri) {
      setIsLoaded(false);
      handleExternalWalletClick({ adapter: walletConnectAdapterName });
    } else if (Object.keys(config).length > 0) {
      setIsLoaded(true);
    }

    const canShowMap: Record<string, boolean> = {};
    Object.keys(config).forEach((adapter) => {
      const adapterConfig = config[adapter];
      if (!adapterConfig.showOnModal) {
        canShowMap[adapter] = false;
        return;
      }
      if (deviceType === "desktop" && adapterConfig.showOnDesktop) {
        canShowMap[adapter] = true;
        return;
      }
      if ((deviceType === "mobile" || deviceType === "tablet") && adapterConfig.showOnMobile) {
        canShowMap[adapter] = true;
        return;
      }
      canShowMap[adapter] = false;
    });
    setAdapterVisibilityMap(canShowMap);
  }, [config, handleExternalWalletClick, walletConnectUri, deviceType]);

  useEffect(() => {
    const buttons: ExternalButton[] = [];
    // add wallet connect links
    if (deviceDetails.platform === bowser.PLATFORMS_MAP.mobile) {
      const mobileLinks = formatMobileRegistry(wcAdapters, walletConnectUri, deviceDetails.os, deviceDetails.platform);
      if (deviceDetails.os === bowser.OS_MAP.iOS) {
        buttons.push(
          ...mobileLinks.map((link) => ({
            name: link.name,
            href: link.href,
            logo: link.logo,
            isLink: true,
            block: false,
          }))
        );
      } else if (mobileLinks.length > 0) {
        buttons.push({
          name: "WalletConnect",
          href: mobileLinks[0].href,
          logo: WALLET_CONNECT_LOGO,
          isLink: true,
          block: true,
        });
      }
    }

    const adapterBtns = Object.keys(config)
      .filter((adapter) => ![WALLET_ADAPTERS.WALLET_CONNECT_V1, WALLET_ADAPTERS.WALLET_CONNECT_V2].includes(adapter) && adapterVisibilityMap[adapter])
      .map((adapter) => ({
        name: adapter,
        isLink: false,
        block: false,
      }));

    if (adapterBtns.length === 1 && deviceDetails.os !== bowser.OS_MAP.iOS) adapterBtns[0].block = true;

    buttons.push(...adapterBtns);
    setExternalButtons(buttons);
  }, [wcAdapters, config, deviceDetails.os, deviceDetails.platform, walletConnectUri, adapterVisibilityMap]);

  return (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-container w3ajs-external-container">
        {showBackButton && (
          <button type="button" className="w3a-external-back w3ajs-external-back" onClick={() => hideExternalWallets()}>
            <Icon iconName="arrow-left" />
            <div className="w3a-group__title">{t("modal.external.back")}</div>
          </button>
        )}
        {!isLoaded && <Loader modalStatus={MODAL_STATUS.CONNECTING} canEmit={false} />}
        {/* <!-- Other Wallet --> */}
        {Object.keys(config).map((adapter) => {
          if (
            walletConnectUri &&
            deviceDetails.platform === bowser.PLATFORMS_MAP.desktop &&
            [WALLET_ADAPTERS.WALLET_CONNECT_V1, WALLET_ADAPTERS.WALLET_CONNECT_V2].includes(adapter)
          ) {
            return <WalletConnect key={adapter} walletConnectUri={walletConnectUri} />;
          }
          return null;
        })}
        {modalStatus === MODAL_STATUS.INITIALIZED && (
          <ul className="w3a-adapter-list w3ajs-wallet-adapters">
            {externalButtons.map((button) => {
              const providerIcon = button.isLink ? (
                <img src={button.logo} height="auto" width="auto" alt={`login-${button.name}`} />
              ) : (
                <Image imageId={`login-${button.name}`} hoverImageId={`login-${button.name}`} isButton />
              );

              const isBlock = externalButtons.length === 1 || button.block;

              const label = isBlock ? <p className="ml-2 text-left">{config[button.name]?.label || button.name}</p> : "";
              return (
                <li className={[`w3a-adapter-item`, isBlock ? "w3a-adapter-item--full" : "col-span-2"].join(" ")} key={button.name}>
                  {button.isLink ? (
                    <a key={button.name} href={button.href} rel="noopener noreferrer" target="_blank">
                      <button type="button" className="w-full w3a-button w3a-button--login">
                        {providerIcon}
                        {label}
                      </button>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleExternalWalletClick({ adapter: button.name })}
                      className="w-full w3a-button w3a-button--login"
                      title={config[button.name]?.label || button.name}
                    >
                      {providerIcon}
                      {label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
