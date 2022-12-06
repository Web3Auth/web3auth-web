import { BaseAdapterConfig, IWalletConnectExtensionAdapter, log, WALLET_ADAPTERS } from "@web3auth/base";
import bowser from "bowser";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MODAL_STATUS, ModalStatusType } from "../interfaces";
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
type platform = "mobile" | "desktop" | "tablet";

export default function ExternalWallet(props: ExternalWalletsProps) {
  const { hideExternalWallets, handleExternalWalletClick, config = {}, walletConnectUri, showBackButton, modalStatus, wcAdapters } = props;
  const [isLoaded, setIsLoaded] = useState(true);
  const [adapterVisibilityMap, setAdapterVisibilityMap] = useState<Record<string, boolean>>({});

  const deviceType = useMemo<platform>(() => {
    const browser = bowser.getParser(window.navigator.userAgent);
    return browser.getPlatformType() as platform;
  }, []);

  const [t] = useTranslation();

  useEffect(() => {
    log.debug("loaded external wallets", config, walletConnectUri);
    const wcAvailable = (config[WALLET_ADAPTERS.WALLET_CONNECT_V1]?.showOnModal || false) !== false;
    if (wcAvailable && !walletConnectUri) {
      setIsLoaded(false);
      handleExternalWalletClick({ adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1 });
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

  return (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-container w3ajs-external-container">
        {showBackButton && (
          <button type="button" className="w3a-external-back w3ajs-external-back" onClick={hideExternalWallets}>
            <Icon iconName="arrow-left" />
            <div className="w3a-group__title">{t("modal.external.back")}</div>
          </button>
        )}
        {!isLoaded && <Loader modalStatus={MODAL_STATUS.CONNECTING} canEmit={false} />}
        {/* <!-- Other Wallet --> */}
        {Object.keys(config).map((adapter) => {
          if (adapter === WALLET_ADAPTERS.WALLET_CONNECT_V1 || adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
            return <WalletConnect key={adapter} walletConnectUri={walletConnectUri} wcAdapters={wcAdapters} />;
          }
          return null;
        })}
        {modalStatus === MODAL_STATUS.INITIALIZED && (
          <ul className="w3a-adapter-list w3ajs-wallet-adapters">
            {Object.keys(config).map((adapter) => {
              if (adapter === WALLET_ADAPTERS.WALLET_CONNECT_V1 || adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
                return null;
              }
              // if (allKeys.length - 1 === index && isOthersLoading) setOthersLoading(false);
              const providerIcon = <Image imageId={`login-${adapter}`} hoverImageId={`login-${adapter}`} isButton />;

              return (
                adapterVisibilityMap[adapter] && (
                  <li className="w3a-adapter-item" key={adapter}>
                    <button
                      type="button"
                      onClick={() => handleExternalWalletClick({ adapter })}
                      className="w3a-button w3a-button--login w-full"
                      title={config[adapter]?.label || adapter}
                    >
                      {providerIcon}
                    </button>
                  </li>
                )
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
