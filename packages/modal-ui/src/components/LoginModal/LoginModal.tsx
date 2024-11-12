import { ChainNamespaceType, cloneDeep, log, WalletRegistry, ADAPTER_NAMES } from "@web3auth/base/src";
import { StateEmitterEvents, SocialLoginEventType, ExternalWalletEventType, ModalState, MODAL_STATUS } from "../../interfaces";
import { Body } from "../Body";
import { Modal } from "../Modal";
import { LOGIN_PROVIDER, type SafeEventEmitter } from "@web3auth/auth";
import { createSignal, createEffect, on, createMemo } from "solid-js";
import deepmerge from "deepmerge";

export interface LoginModalProps {
  stateListener: SafeEventEmitter<StateEmitterEvents>;
  appLogo?: string;
  appName?: string;
  chainNamespace: ChainNamespaceType;
  walletRegistry?: WalletRegistry;
  handleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleExternalWalletClick: (params: ExternalWalletEventType) => void;
  handleShowExternalWallets: (externalWalletsInitialized: boolean) => void;
  closeModal: () => void;
}

const LoginModal = (props: LoginModalProps) => {

  const [modalState, setModalState] = createSignal<ModalState>({
    externalWalletsVisibility: false,
    status: MODAL_STATUS.INITIALIZED,
    hasExternalWallets: false,
    externalWalletsInitialized: false,
    modalVisibility: false,
    modalVisibilityDelayed: false,
    postLoadingMessage: "",
    walletConnectUri: "",
    socialLoginsConfig: {
      loginMethods: {},
      loginMethodsOrder: [],
      adapter: "",
      uiConfig: {},
    },
    externalWalletsConfig: {},
    detailedLoaderAdapter: "",
    detailedLoaderAdapterName: "",
    showExternalWalletsOnly: false,
  });

  createEffect(on(() => props.stateListener,
    () => {
      props.stateListener.emit("MOUNTED");
      props.stateListener.on("STATE_UPDATED", (newModalState: Partial<ModalState>) => {
        log.debug("state updated", newModalState);
        setModalState((prevState) => {
          const mergedState = cloneDeep(deepmerge(prevState, newModalState));
          return mergedState;
        });
      });
    }
  ))

  const preHandleExternalWalletClick = (params: ExternalWalletEventType) => {
    const { adapter } = params;
    setModalState((prevState) => ({
      ...prevState,
      detailedLoaderAdapter: adapter,
      detailedLoaderAdapterName: ADAPTER_NAMES[adapter],
    }));

    // Call the passed-in handler with the params
    props.handleExternalWalletClick(params);
  };

  const preHandleSocialWalletClick = (params: SocialLoginEventType) => {
    const { loginParams } = params;
    setModalState((prevState) => {
      return { ...prevState, detailedLoaderAdapter: loginParams.loginProvider, detailedLoaderAdapterName: loginParams.name };
    });
    props.handleSocialLoginClick(params);
  };

  // Memo for checking if social logins are visible
  const areSocialLoginsVisible = createMemo(() => {
    if (modalState().showExternalWalletsOnly) return false;
    if (Object.keys(modalState().socialLoginsConfig?.loginMethods || {}).length === 0) return false;

    const isAnySocialLoginVisible = Object.entries(modalState().socialLoginsConfig?.loginMethods || {}).some(
      ([k, v]) => k !== LOGIN_PROVIDER.EMAIL_PASSWORDLESS && (v as any).showOnModal !== false
    );
    return isAnySocialLoginVisible;
  });

  // Memo for checking if email passwordless login is visible
  const isEmailPasswordLessLoginVisible = createMemo(() => {
    return modalState().socialLoginsConfig?.loginMethods[LOGIN_PROVIDER.EMAIL_PASSWORDLESS]?.showOnModal;
  });

  // Memo for checking if SMS passwordless login is visible
  const isSmsPasswordLessLoginVisible = createMemo(() => {
    return modalState().socialLoginsConfig?.loginMethods[LOGIN_PROVIDER.SMS_PASSWORDLESS]?.showOnModal;
  });

  // Logging modal state and the result of areSocialLoginsVisible
  log.info("modal state", modalState(), areSocialLoginsVisible());

  const isEmailPrimary = modalState().socialLoginsConfig?.uiConfig?.primaryButton === "emailLogin";
  const isExternalPrimary = modalState().socialLoginsConfig?.uiConfig?.primaryButton === "externalLogin";
  const showPasswordLessInput = isEmailPasswordLessLoginVisible() || isSmsPasswordLessLoginVisible();
  const showExternalWalletButton = modalState().hasExternalWallets;
  const showExternalWalletPage = (areSocialLoginsVisible() || showPasswordLessInput) &&
    !modalState().externalWalletsVisibility;

  const handleExternalWalletBtnClick = (flag: boolean) => {
    setModalState((prevState) => {
      return {
        ...prevState,
        externalWalletsVisibility: flag,
      };
    });
  }

  return (
    <Modal open={true} placement="center" padding={false} showCloseIcon onClose={props.closeModal}>
      <Body {...props}
        showPasswordLessInput={showPasswordLessInput}
        showExternalWalletButton={showExternalWalletButton}
        handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
        socialLoginsConfig={modalState().socialLoginsConfig}
        areSocialLoginsVisible={areSocialLoginsVisible()}
        isEmailPrimary={isEmailPrimary}
        isExternalPrimary={isExternalPrimary}
        showExternalWalletPage={showExternalWalletPage}
        handleExternalWalletBtnClick={handleExternalWalletBtnClick}
        modalState={modalState()}
        preHandleExternalWalletClick={preHandleExternalWalletClick}
      />
    </Modal>
  )
};

export default LoginModal;