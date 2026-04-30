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
        <li key={appUrl} className="wta:w-full">
          <a href={appUrl} rel="noopener noreferrer" target="_blank">
            <button
              type="button"
              className={cn(
                "wta:group wta:relative wta:overflow-hidden wta:h-11 wta:flex wta:w-full wta:items-center wta:justify-start wta:gap-x-2 wta:border wta:border-app-gray-200 wta:bg-app-gray-50 wta:px-5 wta:py-2.5 wta:hover:translate-y-[0.5px] wta:hover:border-app-gray-50 wta:dark:border-app-gray-500 wta:dark:bg-app-gray-800 wta:dark:hover:border-app-gray-800",
                {
                  "wta:rounded-full": buttonRadiusType === "pill",
                  "wta:rounded-lg": buttonRadiusType === "rounded",
                  "wta:rounded-none": buttonRadiusType === "square",
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
              <span className="wta:text-sm wta:font-medium wta:text-app-gray-900 wta:dark:text-app-white">
                {t("modal.external.install-mobile-app", { os: getOsName(osKey as mobileOs) })}
              </span>
              <img
                id="install-links-arrow"
                className="wta:absolute wta:right-4 wta:top-1/2 wta:-translate-x-6 wta:-translate-y-1/2 wta:opacity-0 wta:transition-all wta:duration-300
          wta:group-hover:translate-x-0 wta:group-hover:opacity-100"
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
              "wta:group wta:relative wta:overflow-hidden wta:h-11 wta:flex wta:w-full wta:items-center wta:justify-start wta:gap-x-2 wta:border wta:border-app-gray-200 wta:bg-app-gray-50 wta:px-5 wta:py-2.5 wta:hover:translate-y-[0.5px] wta:hover:border-app-gray-50 wta:dark:border-app-gray-500 wta:dark:bg-app-gray-800 wta:dark:hover:border-app-gray-800",
              {
                "wta:rounded-full": buttonRadiusType === "pill",
                "wta:rounded-lg": buttonRadiusType === "rounded",
                "wta:rounded-none": buttonRadiusType === "square",
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
            <span className="wta:text-sm wta:font-medium wta:text-app-gray-900 wta:dark:text-app-white">
              {t("modal.external.install-browser-extension", { browser: getBrowserName(deviceDetails.browser) })}
            </span>
            <img
              id="install-links-arrow"
              className="wta:absolute wta:right-4 wta:top-1/2 wta:-translate-x-6 wta:-translate-y-1/2 wta:opacity-0 wta:transition-all wta:duration-300
          wta:group-hover:translate-x-0 wta:group-hover:opacity-100"
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
          <p className="wta:mb-2 wta:text-center wta:text-base wta:font-semibold wta:text-app-gray-900 wta:dark:text-app-white">
            {t("modal.getWallet")}
          </p>
          <div className="wta:my-4 wta:flex wta:justify-center">
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
          <ul className="wta:flex wta:flex-col wta:gap-y-2">{deviceDetails.platform === "desktop" ? desktopInstallLinks : mobileInstallLinks}</ul>
        </BottomSheet>
      )}
    </>
  );
}
