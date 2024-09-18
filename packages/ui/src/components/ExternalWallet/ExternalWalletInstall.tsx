import Bowser from "bowser";
import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ExternalButton } from "../../interfaces";
import i18n from "../../localeImport";
import Button from "../Button";
import Image from "../Image";
import ExternalWalletHeader from "./ExternalWalletHeader";

interface ExternalWalletInstallProps {
  connectButton: ExternalButton;
  goBack: () => void;
  closeModal: () => void;
}

type platform = "mobile" | "desktop" | "tablet";
type browser = "chrome" | "firefox" | "edge" | "brave";
type mobileOs = "ios" | "android";

const getBrowserExtensionUrl = (browserType: browser, walletId: string) => {
  if (walletId?.startsWith("https://")) return walletId;
  switch (browserType) {
    case "chrome":
      return `https://chrome.google.com/webstore/detail/${walletId}`;
    case "firefox":
      return `https://addons.mozilla.org/firefox/addon/${walletId}`;
    case "edge":
      return `https://microsoftedge.microsoft.com/addons/detail/${walletId}`;
    default:
      return null;
  }
};

const getMobileInstallLink = (os: mobileOs, appId: string) => {
  if (appId?.includes("https://")) {
    return appId;
  }
  switch (os) {
    case "android":
      return `https://play.google.com/store/apps/details?id=${appId}`;
    case "ios":
      return `https://apps.apple.com/app/safepal-wallet/${appId}`;
    default:
      return "";
  }
};

const getOsName = (os: string) => {
  switch (os) {
    case "ios":
      return "iOS";
    case "android":
      return "Android";
    default:
      return "";
  }
};

const getBrowserName = (browser: string) => {
  return browser.charAt(0).toUpperCase() + browser.slice(1);
};

export default function ExternalWalletInstall(props: ExternalWalletInstallProps) {
  const { connectButton, goBack, closeModal } = props;
  const [t] = useTranslation(undefined, { i18n });

  const deviceDetails = useMemo<{ platform: platform; browser: browser; os: mobileOs }>(() => {
    const browser = Bowser.getParser(window.navigator.userAgent);
    return {
      platform: browser.getPlatformType() as platform,
      browser: browser.getBrowserName().toLowerCase() as browser,
      os: browser.getOSName() as mobileOs,
    };
  }, []);

  const mobileInstallLinks = () => {
    const installConfig = connectButton.walletRegistryItem.app || {};
    const installLinks = Object.keys(installConfig).reduce((acc, os) => {
      if (!["android", "ios"].includes(os)) return acc;
      const appId = installConfig[os as mobileOs];
      if (!appId) return acc;
      const appUrl = getMobileInstallLink(os as mobileOs, appId);
      if (!appUrl) return acc;
      acc.push(
        <li key={os} className="w-full">
          <a href={appUrl} rel="noopener noreferrer" target="_blank">
            <Button type="button" variant="tertiary" className="w-full !justify-start flex items-center gap-2">
              <Image imageId={os} hoverImageId={os} height="30" width="30" isButton />
              <span>{t("modal.external.install-mobile-app", { os: getOsName(os) })}</span>
            </Button>
          </a>
        </li>
      );
      return acc;
    }, [] as ReactNode[]);
    return installLinks;
  };

  const desktopInstallLinks = () => {
    // if browser is brave, use chrome extension
    const browserType = deviceDetails.browser === "brave" ? "chrome" : deviceDetails.browser;
    const browserExtensionConfig = connectButton.walletRegistryItem.app || {};
    const browserExtensionId = browserExtensionConfig[browserType];
    const browserExtensionUrl = browserExtensionId ? getBrowserExtensionUrl(browserType, browserExtensionId) : null;
    const installLink = browserExtensionUrl ? (
      <li key={deviceDetails.browser}>
        <a href={browserExtensionUrl} rel="noopener noreferrer" target="_blank">
          <Button type="button" variant="tertiary" className="w-full !justify-start flex items-center gap-2">
            <Image imageId={deviceDetails.browser} hoverImageId={deviceDetails.browser} height="30" width="30" isButton />
            <span>{t("modal.external.install-browser-extension", { browser: getBrowserName(deviceDetails.browser) })}</span>
          </Button>
        </a>
      </li>
    ) : null;
    return [installLink, ...mobileInstallLinks()];
  };

  return (
    <div>
      {/* Header */}
      <ExternalWalletHeader title={`${t("modal.external.get")} ${connectButton.displayName}`} goBack={goBack} closeModal={closeModal} />

      {/* Wallet image */}
      <div className="flex justify-center my-6">
        <Image
          imageId={`login-${connectButton.name}`}
          hoverImageId={`login-${connectButton.name}`}
          fallbackImageId="wallet"
          height="100"
          width="100"
          isButton
          extension={connectButton.imgExtension}
        />
      </div>

      {/* Download links */}
      <ul className="flex flex-col gap-3">{deviceDetails.platform === "desktop" ? desktopInstallLinks() : mobileInstallLinks()}</ul>
    </div>
  );
}
