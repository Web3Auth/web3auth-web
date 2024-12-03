import { type SafeEventEmitter } from "@web3auth/auth";
import { ChainNamespaceType, WalletRegistry } from "@web3auth/base/src";
import { createSignal, Show } from "solid-js";

import { ExternalWalletEventType, ModalState, SocialLoginEventType, SocialLoginsConfig, StateEmitterEvents } from "../../interfaces";
import Footer from "../Footer/Footer";
import ConnectWallet from "./ConnectWallet";
import Login from "./Login";

export interface BodyProps {
  stateListener: SafeEventEmitter<StateEmitterEvents>;
  appLogo?: string;
  appName?: string;
  chainNamespace: ChainNamespaceType;
  walletRegistry?: WalletRegistry;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  socialLoginsConfig: SocialLoginsConfig;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  showExternalWalletPage: boolean;
  handleExternalWalletBtnClick?: (flag: boolean) => void;
  modalState: ModalState;
  preHandleExternalWalletClick: (params: { adapter: string }) => void;
}

const PAGES = {
  LOGIN: "login",
  CONNECT_WALLET: "connect_wallet",
};

const Body = (props: BodyProps) => {
  const [currentPage, setCurrentPage] = createSignal(PAGES.LOGIN);

  const handleExternalWalletBtnClick = (flag: boolean) => {
    setCurrentPage(PAGES.CONNECT_WALLET);
    if (props.handleExternalWalletBtnClick) props.handleExternalWalletBtnClick(flag);
  };

  const handleBackClick = (flag: boolean) => {
    setCurrentPage(PAGES.LOGIN);
    if (props.handleExternalWalletBtnClick) props.handleExternalWalletBtnClick(flag);
  };

  return (
    <div class="w3a--h-[760px] w3a--p-6 w3a--flex w3a--flex-col w3a--flex-1">
      <Show when={currentPage() === PAGES.LOGIN && !props.showExternalWalletPage}>
        <Login
          showPasswordLessInput={props.showPasswordLessInput}
          showExternalWalletButton={props.showExternalWalletButton}
          handleSocialLoginClick={props.handleSocialLoginClick}
          socialLoginsConfig={props.socialLoginsConfig}
          areSocialLoginsVisible={props.areSocialLoginsVisible}
          isEmailPrimary={props.isEmailPrimary}
          isExternalPrimary={props.isExternalPrimary}
          handleExternalWalletBtnClick={handleExternalWalletBtnClick}
        />
      </Show>
      <Show when={currentPage() === PAGES.CONNECT_WALLET && props.showExternalWalletPage}>
        <ConnectWallet
          onBackClick={handleBackClick}
          modalStatus={props.modalState.status}
          showBackButton={props.areSocialLoginsVisible || props.showPasswordLessInput}
          handleExternalWalletClick={props.preHandleExternalWalletClick}
          chainNamespace={props.chainNamespace}
          walletConnectUri={props.modalState.walletConnectUri}
          config={props.modalState.externalWalletsConfig}
          walletRegistry={props.walletRegistry}
        />
      </Show>
      <Footer />
    </div>
  );
};

export default Body;
