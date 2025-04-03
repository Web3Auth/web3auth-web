import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import { cn, getIcons } from "../../../utils";
import Button, { BUTTON_TYPE } from "../../Button";
import { ConnectWalletListProps, MoreWalletsButtonProps, WalletsFoundProps } from "./ConnectWalletList.type";

function NoWalletsFound() {
  const [t] = useTranslation(undefined, { i18n });

  return (
    <div className="w3a--flex w3a--w-full w3a--items-center w3a--justify-center w3a--py-6 w3a--text-center w3a--text-app-gray-400 dark:w3a--text-app-gray-500">
      {t("modal.external.no-wallets-found")}
    </div>
  );
}

function WalletsFound(props: WalletsFoundProps) {
  const { externalButtons, isLoading, handleWalletClick, deviceDetails, walletConnectUri } = props;

  if (isLoading) {
    return (
      <div className="w3a--flex w3a--flex-col w3a--gap-y-2 w3a--pr-1.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`loader-${index}`}
            className="w3a--h-12 w3a--w-full w3a--animate-pulse w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w3a--flex w3a--flex-col w3a--gap-y-2 w3a--pr-1.5">
      {externalButtons.map((button) => (
        <Button
          key={button.name}
          type={BUTTON_TYPE.WALLET}
          props={{
            label: button.displayName,
            onClick: () => handleWalletClick(button),
            button,
            deviceDetails,
            walletConnectUri,
          }}
        />
      ))}
    </div>
  );
}

function MoreWalletsButton(props: MoreWalletsButtonProps) {
  const { totalExternalWallets, initialWalletCount, handleMoreWallets, isLoading, isDark } = props;

  const onMoreWalletsClick = () => {
    if (handleMoreWallets) {
      handleMoreWallets();
    }
  };

  if (isLoading && initialWalletCount < totalExternalWallets) {
    return <div className="w3a--h-12 w3a--w-full w3a--animate-pulse w3a--rounded-full w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700" />;
  }

  return (
    <button
      type="button"
      className="w3a--flex w3a--items-center w3a--justify-start w3a--gap-x-2 w3a--rounded-2xl w3a--bg-app-gray-50 w3a--p-3 hover:w3a--bg-app-gray-200 dark:w3a--bg-app-gray-800 dark:hover:w3a--bg-app-gray-600"
      onClick={onMoreWalletsClick}
    >
      <img src={getIcons(isDark ? "view-dark" : "view-light")} alt="view" height="24" width="24" />
      <p className="w3a--text-base w3a--font-normal w3a--text-app-gray-700 dark:w3a--text-app-white">More Wallets</p>
      <span
        className="w3a--inline-flex w3a--items-center w3a--rounded-full w3a--bg-app-primary-100 w3a--px-2 w3a--py-1 w3a--text-xs w3a--font-medium w3a--text-app-primary-800 
        dark:w3a--border dark:w3a--border-app-primary-400 dark:w3a--bg-transparent dark:w3a--text-app-primary-400"
      >
        {totalExternalWallets - initialWalletCount}
      </span>
    </button>
  );
}

function ConnectWalletList(props: ConnectWalletListProps) {
  const {
    externalButtons,
    isLoading,
    totalExternalWallets,
    initialWalletCount,
    handleWalletClick,
    handleMoreWallets,
    isDark,
    deviceDetails,
    walletConnectUri,
  } = props;

  return (
    <>
      <ul className={cn("w3a--overflow-y-auto w3a--flex w3a--flex-col w3a--gap-y-2 w3a--h-[400px]")}>
        {externalButtons.length === 0 ? (
          <NoWalletsFound />
        ) : (
          <WalletsFound
            externalButtons={externalButtons}
            isLoading={isLoading}
            handleWalletClick={handleWalletClick}
            deviceDetails={deviceDetails}
            walletConnectUri={walletConnectUri}
          />
        )}
      </ul>
      {totalExternalWallets > 15 && !isLoading && initialWalletCount < totalExternalWallets && (
        <MoreWalletsButton
          totalExternalWallets={totalExternalWallets}
          initialWalletCount={initialWalletCount}
          handleMoreWallets={handleMoreWallets}
          isLoading={isLoading}
          isDark={isDark}
        />
      )}
    </>
  );
}

export default ConnectWalletList;
