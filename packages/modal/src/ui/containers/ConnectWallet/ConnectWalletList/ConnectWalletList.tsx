import { useTranslation } from "react-i18next";

import Button, { BUTTON_TYPE } from "../../../components/Button";
import { useWidget } from "../../../context/WidgetContext";
import i18n from "../../../localeImport";
import { cn, getIcons } from "../../../utils";
import { ConnectWalletListProps, MoreWalletsButtonProps, WalletsFoundProps } from "./ConnectWalletList.type";

function NoWalletsFound() {
  const [t] = useTranslation(undefined, { i18n });

  return (
    <div className="wta:flex wta:w-full wta:items-center wta:justify-center wta:py-6 wta:text-center wta:text-app-gray-400 wta:dark:text-app-gray-500">
      {t("modal.external.no-wallets-found")}
    </div>
  );
}

function WalletsFound(props: WalletsFoundProps) {
  const { externalButtons, isLoading, handleWalletClick, walletConnectUri } = props;
  const { deviceDetails, uiConfig, isDark } = useWidget();
  const { buttonRadiusType: buttonRadius } = uiConfig;

  if (isLoading) {
    return (
      <div className="wta:flex wta:flex-col wta:gap-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`loader-${index}`}
            className={cn("wta:h-12 wta:w-full wta:animate-pulse wta:rounded-2xl wta:bg-app-gray-200 wta:dark:bg-app-gray-700", {
              "wta:rounded-full": buttonRadius === "pill",
              "wta:rounded-lg": buttonRadius === "rounded",
              "wta:rounded-none": buttonRadius === "square",
            })}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="wta:flex wta:flex-col wta:gap-y-2">
      {externalButtons.map((button) => (
        <Button
          key={button.name}
          type={BUTTON_TYPE.WALLET}
          props={{
            isDark,
            label: button.displayName,
            onClick: () => handleWalletClick(button),
            button,
            deviceDetails,
            walletConnectUri,
            buttonRadius,
          }}
        />
      ))}
    </div>
  );
}

function MoreWalletsButton(props: MoreWalletsButtonProps) {
  const { totalExternalWalletsCount, initialWalletCount, handleMoreWallets, isLoading, isDark } = props;
  const { uiConfig } = useWidget();
  const { buttonRadiusType: buttonRadius } = uiConfig;
  const [t] = useTranslation(undefined, { i18n });
  const onMoreWalletsClick = () => {
    if (handleMoreWallets) {
      handleMoreWallets();
    }
  };

  if (isLoading && initialWalletCount < totalExternalWalletsCount) {
    return (
      <div
        className={cn("wta:h-12 wta:w-full wta:animate-pulse wta:bg-app-gray-200 wta:dark:bg-app-gray-700", {
          "wta:rounded-full": buttonRadius === "pill",
          "wta:rounded-lg": buttonRadius === "rounded",
          "wta:rounded-none": buttonRadius === "square",
        })}
      />
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "wta:flex wta:items-center wta:justify-start wta:gap-x-2 wta:bg-app-gray-50 wta:p-3 wta:hover:bg-app-gray-200 wta:dark:bg-app-gray-800 wta:dark:hover:bg-app-gray-600 wta:active:scale-95 wta:transition-all wta:duration-150",
        {
          "wta:rounded-full": buttonRadius === "pill",
          "wta:rounded-lg": buttonRadius === "rounded",
          "wta:rounded-none": buttonRadius === "square",
        }
      )}
      onClick={onMoreWalletsClick}
    >
      <img src={getIcons(isDark ? "view-dark" : "view-light")} alt="view" height="24" width="24" />
      <p className="wta:text-base wta:font-normal wta:text-app-gray-700 wta:dark:text-app-white">{t("modal.connect-wallet.more-wallets")}</p>
      <span
        className="wta:inline-flex wta:items-center wta:rounded-full wta:bg-app-primary-100 wta:px-2 wta:py-1 wta:text-xs wta:font-medium wta:text-app-primary-800 
        wta:dark:border wta:dark:border-app-primary-400 wta:dark:bg-transparent wta:dark:text-app-primary-400"
      >
        {totalExternalWalletsCount - initialWalletCount}
      </span>
    </button>
  );
}

function ConnectWalletList(props: ConnectWalletListProps) {
  const {
    externalButtons,
    isLoading,
    totalExternalWalletsCount,
    initialWalletCount,
    handleWalletClick,
    handleMoreWallets,
    isDark,
    walletConnectUri,
    isShowAllWallets,
  } = props;

  const onShowMoreWalletsClick = () => {
    handleMoreWallets();
  };

  const showMoreWalletsButton = !isShowAllWallets;

  return (
    <>
      <ul
        className={cn("wta:overflow-y-auto wta:flex wta:flex-col wta:gap-y-2 wta:h-[280px] w3a--social-container wta:-mx-5 wta:pl-5 wta:pr-1", {
          "wta:h-[328px]": !showMoreWalletsButton,
        })}
      >
        {externalButtons.length === 0 ? (
          <NoWalletsFound />
        ) : (
          <WalletsFound
            externalButtons={externalButtons}
            isLoading={isLoading}
            handleWalletClick={handleWalletClick}
            walletConnectUri={walletConnectUri}
          />
        )}
      </ul>
      {showMoreWalletsButton && !isLoading && initialWalletCount < totalExternalWalletsCount && (
        <MoreWalletsButton
          totalExternalWalletsCount={totalExternalWalletsCount}
          initialWalletCount={initialWalletCount}
          handleMoreWallets={onShowMoreWalletsClick}
          isLoading={isLoading}
          isDark={isDark}
        />
      )}
    </>
  );
}

export default ConnectWalletList;
