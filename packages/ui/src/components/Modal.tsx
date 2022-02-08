import { BaseAdapterConfig, LoginMethodConfig } from "@web3auth/base";
import React, { useEffect, useState } from "react";

import ExternalWallets from "./ExternalWallets";
import Footer from "./Footer";
import Header from "./Header";
import Loader from "./Loader";
import SocialLoginEmail from "./SocialLoginEmail";
import SocialLogins from "./SocialLogins";
interface ModalProps {
  isDark: boolean;
  appLogo: string;
  version: string;
  loginMethods: LoginMethodConfig;
  externalWalletConfig: Record<string, BaseAdapterConfig>;
}

// const closeIcon = AllImages.close.image;

export default function Modal(props: ModalProps) {
  const [isLoading, setLoading] = useState(false);
  const [externalWalletsVisible, setExternalWalletsVisibility] = useState(false);

  const { appLogo, isDark, version, loginMethods, externalWalletConfig } = props;
  useEffect(() => {
    setLoading(false);
  }, []);

  //   const web3authIcon = AllImages[`web3auth${isDark ? "-light" : ""}`].image;
  const modalClassName = `w3a-modal ${isDark ? "" : " w3a-modal--light"}`;
  return (
    <div id="w3a-modal" className={modalClassName}>
      <div className="w3a-modal__inner w3a-modal__inner--active">
        <Loader isLoading={isLoading} />
        <Header appLogo={appLogo} />
        <div className="w3a-modal__content w3ajs-content">
          {!externalWalletsVisible ? (
            <>
              <SocialLogins loginMethods={loginMethods} isDark={isDark} />
              <SocialLoginEmail />
              <div className="w3ajs-external-wallet w3a-group">
                <div className="w3a-external-toggle w3ajs-external-toggle">
                  <h6 className="w3a-group__title">EXTERNAL WALLET</h6>
                  <button
                    className="w3a-button w3ajs-external-toggle__button"
                    onClick={() => {
                      setExternalWalletsVisibility(true);
                    }}
                  >
                    Connect with Wallet
                  </button>
                </div>
              </div>
            </>
          ) : (
            <ExternalWallets
              config={externalWalletConfig}
              showWalletConnect={false}
              hideExternalWallets={() => setExternalWalletsVisibility(false)}
            />
          )}
        </div>

        <Footer version={version} />
      </div>
    </div>
  );
}
