import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import { cloneDeep, CONNECTOR_NAMES, log, WALLET_CONNECTOR_TYPE, WALLET_CONNECTORS, WIDGET_TYPE } from "@web3auth/no-modal";
import deepmerge from "deepmerge";
import {
  createContext,
  type Dispatch,
  type FC,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PAGES } from "../constants";
import { type ExternalWalletEventType, MODAL_STATUS, ModalState, type SocialLoginEventType, StateEmitterEvents } from "../interfaces";
import { useWidget } from "./WidgetContext";

type StateListener = {
  on: <K extends keyof StateEmitterEvents>(event: K, listener: StateEmitterEvents[K]) => void;
  emit: <K extends keyof StateEmitterEvents>(event: K, ...args: Parameters<StateEmitterEvents[K]>) => void;
};

type ModalStateContextType = {
  modalState: ModalState;
  setModalState: Dispatch<SetStateAction<ModalState>>;
  preHandleExternalWalletClick: (params: ExternalWalletEventType) => void;
  preHandleSocialLoginClick: (params: SocialLoginEventType) => void;
  handleShowExternalWallets: (flag: boolean) => void;
  areSocialLoginsVisible: boolean;
  isEmailPrimary: boolean;
  isExternalPrimary: boolean;
  isEmailPasswordLessLoginVisible: boolean;
  isSmsPasswordLessLoginVisible: boolean;
  showPasswordLessInput: boolean;
  showExternalWalletButton: boolean;
  shouldShowLoginPage: boolean;
};

type ModalStateProviderProps = {
  children: ReactNode;
  stateListener: StateListener;
};

const initialModalState: ModalState = {
  // UI State
  status: MODAL_STATUS.INITIALIZED,
  modalVisibility: false,
  externalWalletsVisibility: false,
  currentPage: PAGES.LOGIN_OPTIONS,

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
    uiConfig: {},
  },
  externalWalletsConfig: {},
};

const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);

export const ModalStateProvider: FC<ModalStateProviderProps> = ({ children, stateListener }) => {
  const { uiConfig, handleExternalWalletClick, handleSocialLoginClick, handleShowExternalWallets: onShowExternalWallets } = useWidget();

  const initialVisibility = useMemo(() => uiConfig.widgetType === WIDGET_TYPE.EMBED, [uiConfig.widgetType]);

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

  const preHandleExternalWalletClick = useCallback(
    (params: ExternalWalletEventType) => {
      const { connector } = params;
      setModalState((prevState) => ({
        ...prevState,
        detailedLoaderConnector: connector,
        detailedLoaderConnectorName: CONNECTOR_NAMES[connector as WALLET_CONNECTOR_TYPE],
      }));
      handleExternalWalletClick?.(params);
    },
    [handleExternalWalletClick]
  );

  const preHandleSocialLoginClick = useCallback(
    (params: SocialLoginEventType) => {
      const { loginParams } = params;
      setModalState((prevState) => ({
        ...prevState,
        detailedLoaderConnector: loginParams.authConnection,
        detailedLoaderConnectorName: loginParams.name,
      }));
      handleSocialLoginClick?.(params);
    },
    [handleSocialLoginClick]
  );

  const handleShowExternalWallets = useCallback(
    (flag: boolean) => {
      setModalState((prevState) => ({
        ...prevState,
        externalWalletsVisibility: flag,
      }));
      if (flag && onShowExternalWallets) onShowExternalWallets(modalState.externalWalletsInitialized);
    },
    [onShowExternalWallets, modalState.externalWalletsInitialized]
  );

  // TODO: check if can further refactor this logic
  const shouldShowLoginPage = useMemo(
    () =>
      (areSocialLoginsVisible || showPasswordLessInput || !!modalState.externalWalletsConfig[WALLET_CONNECTORS.METAMASK]) &&
      !modalState.externalWalletsVisibility,
    [areSocialLoginsVisible, showPasswordLessInput, modalState.externalWalletsVisibility, modalState.externalWalletsConfig]
  );

  const value = useMemo(
    () => ({
      modalState,
      setModalState,
      preHandleExternalWalletClick,
      preHandleSocialLoginClick,
      handleShowExternalWallets,
      areSocialLoginsVisible,
      isEmailPrimary,
      isExternalPrimary,
      isEmailPasswordLessLoginVisible,
      isSmsPasswordLessLoginVisible,
      showPasswordLessInput,
      showExternalWalletButton,
      shouldShowLoginPage,
    }),
    [
      modalState,
      preHandleExternalWalletClick,
      preHandleSocialLoginClick,
      handleShowExternalWallets,
      isEmailPrimary,
      isExternalPrimary,
      areSocialLoginsVisible,
      isEmailPasswordLessLoginVisible,
      isSmsPasswordLessLoginVisible,
      showPasswordLessInput,
      showExternalWalletButton,
      shouldShowLoginPage,
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
