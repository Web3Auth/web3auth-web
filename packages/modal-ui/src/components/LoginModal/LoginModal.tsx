import { ChainNamespaceType, cloneDeep, log, WalletRegistry } from "@web3auth/base";
import { StateEmitterEvents, SocialLoginEventType, ExternalWalletEventType, ModalState, MODAL_STATUS } from "../../interfaces";
import { Body } from "../Body";
import { Modal } from "../Modal";
import { type SafeEventEmitter } from "@web3auth/auth";
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

  const preHandleExternalWalletClick = createMemo(
    (params: ExternalWalletEventType) => {
      const { adapter } = params;
      setModalState((prevState) => {
        return { ...prevState, detailedLoaderAdapter: adapter, detailedLoaderAdapterName: ADAPTER_NAMES[adapter] };
      });
      props.handleExternalWalletClick(params);
    },
    props.handleExternalWalletClick
  );

  const preHandleSocialWalletClick = (params: SocialLoginEventType) => {
    const { loginParams } = params;
    setModalState((prevState) => {
      return { ...prevState, detailedLoaderAdapter: loginParams.loginProvider, detailedLoaderAdapterName: loginParams.name };
    });
    props.handleSocialLoginClick(params);
  };

  const isEmailPrimary = modalState().socialLoginsConfig?.uiConfig?.primaryButton === "emailLogin";
  const isExternalPrimary = modalState().socialLoginsConfig?.uiConfig?.primaryButton === "externalLogin";


  return (
    <Modal open={true} placement="center" padding={false} showCloseIcon>
      <Body {...props} />
    </Modal>
  )
};

export default LoginModal;