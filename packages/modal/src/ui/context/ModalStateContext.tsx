import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import { cloneDeep, log, WALLET_CONNECTOR_TYPE, WALLET_CONNECTORS } from "@web3auth/no-modal";
import deepmerge from "deepmerge";
import { createContext, type Dispatch, type FC, type ReactNode, type SetStateAction, useContext, useEffect, useMemo, useState } from "react";

import { PAGES } from "../constants";
import { MODAL_STATUS, ModalState, StateEmitterEvents } from "../interfaces";

type StateListener = {
  on: <K extends keyof StateEmitterEvents>(event: K, listener: StateEmitterEvents[K]) => void;
  emit: <K extends keyof StateEmitterEvents>(event: K, ...args: Parameters<StateEmitterEvents[K]>) => void;
};

type ModalStateContextType = {
  modalState: ModalState;
  setModalState: Dispatch<SetStateAction<ModalState>>;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  showExternalWalletPage: boolean;
};

type ModalStateProviderProps = {
  children: ReactNode;
  stateListener: StateListener;
  initialVisibility?: boolean;
};

const initialModalState: ModalState = {
  // UI State
  status: MODAL_STATUS.INITIALIZED,
  modalVisibility: false,
  modalVisibilityDelayed: false,
  externalWalletsVisibility: false,
  currentPage: PAGES.LOGIN,

  // Loading State
  postLoadingMessage: "",
  detailedLoaderConnector: "",
  detailedLoaderConnectorName: "",

  // External Wallets State
  hasExternalWallets: false,
  externalWalletsInitialized: false,
  showExternalWalletsOnly: false,
  walletConnectUri: "",
  metamaskConnectUri: "",

  // Config State
  socialLoginsConfig: {
    loginMethods: {},
    loginMethodsOrder: [],
    connector: "" as WALLET_CONNECTOR_TYPE,
    uiConfig: {},
  },
  externalWalletsConfig: {},
};

const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);

export const ModalStateProvider: FC<ModalStateProviderProps> = ({ children, stateListener, initialVisibility = false }) => {
  const [modalState, setModalState] = useState<ModalState>({
    ...initialModalState,
    modalVisibility: initialVisibility,
  });

  // Listen for external state updates
  useEffect(() => {
    stateListener.on("STATE_UPDATED", (newModalState: Partial<ModalState>) => {
      log.debug("state updated", newModalState);
      setModalState((prevState) => {
        const mergedState = cloneDeep(deepmerge(prevState, newModalState, { arrayMerge: (_prevState, newState) => newState }));
        return mergedState;
      });
    });
    stateListener.emit("MOUNTED");
  }, [stateListener]);

  // Update visibility when initialVisibility changes
  useEffect(() => {
    setModalState((prev) => ({ ...prev, modalVisibility: initialVisibility }));
  }, [initialVisibility]);

  const isEmailPrimary = useMemo(() => modalState.socialLoginsConfig?.uiConfig?.primaryButton === "emailLogin", [modalState.socialLoginsConfig]);
  const isExternalPrimary = useMemo(
    () => modalState.socialLoginsConfig?.uiConfig?.primaryButton === "externalLogin",
    [modalState.socialLoginsConfig]
  );

  // Memo for checking if social logins are visible
  const areSocialLoginsVisible = useMemo(() => {
    if (modalState.showExternalWalletsOnly) return false;
    if (Object.keys(modalState.socialLoginsConfig?.loginMethods || {}).length === 0) return false;

    const isAnySocialLoginVisible = Object.entries(modalState.socialLoginsConfig?.loginMethods || {}).some(
      ([k, v]) =>
        !([AUTH_CONNECTION.EMAIL_PASSWORDLESS, AUTH_CONNECTION.SMS_PASSWORDLESS] as AUTH_CONNECTION_TYPE[]).includes(k as AUTH_CONNECTION_TYPE) &&
        v.showOnModal !== false
    );
    return isAnySocialLoginVisible;
  }, [modalState.showExternalWalletsOnly, modalState.socialLoginsConfig]);

  // Memo for checking if email passwordless login is visible
  const isEmailPasswordLessLoginVisible = useMemo(() => {
    return modalState.socialLoginsConfig?.loginMethods[AUTH_CONNECTION.EMAIL_PASSWORDLESS]?.showOnModal;
  }, [modalState.socialLoginsConfig]);

  // Memo for checking if SMS passwordless login is visible
  const isSmsPasswordLessLoginVisible = useMemo(() => {
    return modalState.socialLoginsConfig?.loginMethods[AUTH_CONNECTION.SMS_PASSWORDLESS]?.showOnModal;
  }, [modalState.socialLoginsConfig]);

  const showPasswordLessInput = useMemo(
    () => isEmailPasswordLessLoginVisible || isSmsPasswordLessLoginVisible,
    [isEmailPasswordLessLoginVisible, isSmsPasswordLessLoginVisible]
  );

  const showExternalWalletButton = useMemo(
    () => modalState.hasExternalWallets || !!modalState.externalWalletsConfig[WALLET_CONNECTORS.METAMASK],
    [modalState.hasExternalWallets, modalState.externalWalletsConfig]
  );

  // TODO: rename this to be correct and refactor the logic
  const showExternalWalletPage = useMemo(
    () =>
      (areSocialLoginsVisible || showPasswordLessInput || !!modalState.externalWalletsConfig[WALLET_CONNECTORS.METAMASK]) &&
      !modalState.externalWalletsVisibility,
    [areSocialLoginsVisible, showPasswordLessInput, modalState.externalWalletsVisibility, modalState.externalWalletsConfig]
  );

  const value = useMemo(
    () => ({
      modalState,
      setModalState,
      areSocialLoginsVisible,
      isEmailPrimary,
      isExternalPrimary,
      isEmailPasswordLessLoginVisible,
      isSmsPasswordLessLoginVisible,
      showPasswordLessInput,
      showExternalWalletButton,
      showExternalWalletPage,
    }),
    [
      modalState,
      isEmailPrimary,
      isExternalPrimary,
      areSocialLoginsVisible,
      isEmailPasswordLessLoginVisible,
      isSmsPasswordLessLoginVisible,
      showPasswordLessInput,
      showExternalWalletButton,
      showExternalWalletPage,
    ]
  );

  return <ModalStateContext.Provider value={value}>{children}</ModalStateContext.Provider>;
};

export const useModalState = () => {
  const context = useContext(ModalStateContext);
  if (!context) {
    throw new Error("useModalState must be used within a ModalStateProvider");
  }
  return context;
};
