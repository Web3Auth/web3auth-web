import { createEffect, createSignal, on } from "solid-js";
import Footer from "../Footer/Footer";
import ConnectWallet from "./ConnectWallet";
import Login from "./Login";
import { SocialLoginEventType, ExternalWalletEventType, StateEmitterEvents, ModalState, MODAL_STATUS } from "../../interfaces";
import { LOGIN_PROVIDER, type SafeEventEmitter } from "@web3auth/auth";
import { ADAPTER_NAMES, ChainNamespaceType, cloneDeep, log, WalletRegistry } from "@web3auth/base";
import deepmerge from "deepmerge";
// import { on } from "events";
export interface BodyProps {
  stateListener: SafeEventEmitter<StateEmitterEvents>;
  appLogo?: string;
  appName?: string;
  chainNamespace: ChainNamespaceType;
  walletRegistry?: WalletRegistry;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
}

const PAGES = {
  LOGIN: 'login',
  CONNECT_WALLET: 'connect_wallet'
}

const Body = (props: BodyProps) => {
  const [currentPage, setCurrentPage] = createSignal(PAGES.LOGIN);

  return (
    <div class="w3a--h-[760px] w3a--p-6 w3a--flex w3a--flex-col w3a--flex-1">
      {currentPage() === PAGES.LOGIN && <Login onExternalWalletClick={() => setCurrentPage(PAGES.CONNECT_WALLET)} />}
      {currentPage() === PAGES.CONNECT_WALLET && <ConnectWallet onBackClick={() => setCurrentPage(PAGES.LOGIN)} />}
      <Footer />
    </div>
  );
};

export default Body