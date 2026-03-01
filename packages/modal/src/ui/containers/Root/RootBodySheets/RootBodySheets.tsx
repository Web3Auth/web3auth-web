import { JSX, useMemo } from "react";
import { useTranslation } from "react-i18next";

import BottomSheet from "../../../components/BottomSheet";
import Image from "../../../components/Image";
import { useModalState } from "../../../context/ModalStateContext";
import { useBodyState } from "../../../context/RootContext";
import { useWidget } from "../../../context/WidgetContext";
import { mobileOs } from "../../../interfaces";
import i18n from "../../../localeImport";
import { cn, getBrowserExtensionUrl, getBrowserName, getIcons, getMobileInstallLink, getOsName } from "../../../utils";
import ConnectWalletChainNamespaceSelect from "../../ConnectWallet/ConnectWalletChainNamespaceSelect";

export default function RootBodySheets() {
  const [t] = useTranslation(undefined, { i18n });
  const { preHandleExternalWalletClick } = useModalState();
  const { bodyState, setBodyState } = useBodyState();
  const { isDark, deviceDetails, uiConfig } = useWidget();
  const { buttonRadiusType } = uiConfig;

  const mobileInstallLinks = useMemo<JSX.Element[]>(() => {
    if (deviceDetails.platform === "desktop") return [];
    const installConfig = bodyState.installLinks?.wallet?.walletRegistryItem?.app || {};
    const installLinks = Object.keys(installConfig).reduce((acc, osKey) => {
      if (!["android", "ios"].includes(osKey)) return acc;
      const appId = installConfig[osKey as mobileOs];
      if (!appId) return acc;
      const appUrl = getMobileInstallLink(osKey as mobileOs, appId);
      if (!appUrl) return acc;
      const logoLight = `${osKey}-light`;
      const logoDark = `${osKey}-dark`;
      acc.push(
        <li key={appUrl} className="w3a--w-full">
          <a href={appUrl} rel="noopener noreferrer" target="_blank">
            <button
              type="button"
              className={cn(
                "w3a--group w3a--relative w3a--overflow-hidden w3a--h-11 w3a--flex w3a--w-full w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--px-5 w3a--py-2.5 hover:w3a--translate-y-[0.5px] hover:w3a--border-app-gray-50 dark:w3a--border-app-gray-500 dark:w3a--bg-app-gray-800 dark:hover:w3a--border-app-gray-800",
                {
                  "w3a--rounded-full": buttonRadiusType === "pill",
                  "w3a--rounded-lg": buttonRadiusType === "rounded",
                  "w3a--rounded-none": buttonRadiusType === "square",
                }
              )}
            >
              <Image
                imageId={logoLight}
                darkImageId={logoDark}
                hoverImageId={logoLight}
                darkHoverImageId={logoDark}
                height="28"
                width="28"
                isButton
              />
              <span className="w3a--text-sm w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
                {t("modal.external.install-mobile-app", { os: getOsName(osKey as mobileOs) })}
              </span>
              <img
                id="install-links-arrow"
                className="w3a--absolute w3a--right-4 w3a--top-1/2 -w3a--translate-x-6 -w3a--translate-y-1/2 w3a--opacity-0 w3a--transition-all w3a--duration-300
          group-hover:w3a--translate-x-0 group-hover:w3a--opacity-100"
                src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
                alt="arrow"
              />
            </button>
          </a>
        </li>
      );
      return acc;
    }, []);
    return installLinks;
  }, [bodyState.installLinks?.wallet?.walletRegistryItem?.app, deviceDetails.platform, isDark, t, buttonRadiusType]);

  const desktopInstallLinks = useMemo<JSX.Element[]>(() => {
    if (deviceDetails.platform !== "desktop") return [];
    const browserType = deviceDetails.browser === "brave" ? "chrome" : deviceDetails.browser;
    const browserExtensionConfig = bodyState.installLinks?.wallet?.walletRegistryItem?.app || {};
    const extensionForCurrentBrowser =
      browserExtensionConfig.browser && browserExtensionConfig.browser.includes(browserType) ? browserExtensionConfig.browser : undefined;
    const browserExtensionId = browserExtensionConfig[browserType as keyof typeof browserExtensionConfig] || extensionForCurrentBrowser;
    const browserExtensionUrl = browserExtensionId ? getBrowserExtensionUrl(browserType, browserExtensionId) : null;
    const installLink = browserExtensionUrl ? (
      <li key={browserExtensionUrl}>
        <a href={browserExtensionUrl} rel="noopener noreferrer" target="_blank">
          <button
            type="button"
            className={cn(
              "w3a--group w3a--relative w3a--overflow-hidden w3a--h-11 w3a--flex w3a--w-full w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--border w3a--border-app-gray-200 w3a--bg-app-gray-50 w3a--px-5 w3a--py-2.5 hover:w3a--translate-y-[0.5px] hover:w3a--border-app-gray-50 dark:w3a--border-app-gray-500 dark:w3a--bg-app-gray-800 dark:hover:w3a--border-app-gray-800",
              {
                "w3a--rounded-full": buttonRadiusType === "pill",
                "w3a--rounded-lg": buttonRadiusType === "rounded",
                "w3a--rounded-none": buttonRadiusType === "square",
              }
            )}
          >
            <Image
              imageId={deviceDetails.browser}
              darkImageId={deviceDetails.browser}
              hoverImageId={deviceDetails.browser}
              darkHoverImageId={deviceDetails.browser}
              height="30"
              width="30"
              isButton
            />
            <span className="w3a--text-sm w3a--font-medium w3a--text-app-gray-900 dark:w3a--text-app-white">
              {t("modal.external.install-browser-extension", { browser: getBrowserName(deviceDetails.browser) })}
            </span>
            <img
              id="install-links-arrow"
              className="w3a--absolute w3a--right-4 w3a--top-1/2 -w3a--translate-x-6 -w3a--translate-y-1/2 w3a--opacity-0 w3a--transition-all w3a--duration-300
          group-hover:w3a--translate-x-0 group-hover:w3a--opacity-100"
              src={getIcons(isDark ? "chevron-right-dark" : "chevron-right-light")}
              alt="arrow"
            />
          </button>
        </a>
      </li>
    ) : null;
    return [installLink, ...mobileInstallLinks];
  }, [
    bodyState.installLinks?.wallet?.walletRegistryItem?.app,
    deviceDetails.browser,
    deviceDetails.platform,
    isDark,
    mobileInstallLinks,
    buttonRadiusType,
    t,
  ]);

  return (
    <>
      {/* Multi Chain Selector */}
      {bodyState.multiChainSelector?.show && (
        <BottomSheet
          borderRadiusType={uiConfig.borderRadiusType}
          isShown={bodyState.multiChainSelector.show}
          onClose={() => setBodyState({ ...bodyState, multiChainSelector: { show: false, wallet: null } })}
        >
          <ConnectWalletChainNamespaceSelect
            isDark={isDark}
            wallet={bodyState.multiChainSelector.wallet}
            handleExternalWalletClick={(params) => {
              preHandleExternalWalletClick(params);
              setBodyState({ ...bodyState, multiChainSelector: { show: false, wallet: null } });
            }}
          />
        </BottomSheet>
      )}

      {/* Wallet Install Links */}
      {bodyState.installLinks?.show && (
        <BottomSheet
          borderRadiusType={uiConfig.borderRadiusType}
          isShown={bodyState.installLinks.show}
          onClose={() => setBodyState({ ...bodyState, installLinks: { show: false, wallet: null } })}
        >
          <p className="w3a--mb-2 w3a--text-center w3a--text-base w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">
            {t("modal.getWallet")}
          </p>
          <div className="w3a--my-4 w3a--flex w3a--justify-center">
            <Image
              imageId={`login-${bodyState.installLinks.wallet.name}`}
              hoverImageId={`login-${bodyState.installLinks.wallet.name}`}
              fallbackImageId="wallet"
              height="80"
              width="80"
              isButton
              extension={bodyState.installLinks.wallet.imgExtension}
            />
          </div>
          <ul className="w3a--flex w3a--flex-col w3a--gap-y-2">{deviceDetails.platform === "desktop" ? desktopInstallLinks : mobileInstallLinks}</ul>
        </BottomSheet>
      )}
    </>
  );
}
