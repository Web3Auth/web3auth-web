import { cloneDeep, log, WALLET_CONNECTOR_TYPE } from "@web3auth/no-modal";
import deepmerge from "deepmerge";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { PAGES } from "../constants";
import { MODAL_STATUS, ModalState, StateEmitterEvents } from "../interfaces";

type StateListener = {
  on: <K extends keyof StateEmitterEvents>(event: K, listener: StateEmitterEvents[K]) => void;
  emit: <K extends keyof StateEmitterEvents>(event: K, ...args: Parameters<StateEmitterEvents[K]>) => void;
};

type ModalStateContextType = {
  modalState: ModalState;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  updateModalState: (newState: Partial<ModalState>) => void;
};

type ModalStateProviderProps = {
  children: React.ReactNode;
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

export const ModalStateProvider: React.FC<ModalStateProviderProps> = ({ children, stateListener, initialVisibility = false }) => {
  const [modalState, setModalState] = useState<ModalState>({
    ...initialModalState,
    modalVisibility: initialVisibility,
  });

  // Helper function for partial updates with deep merge
  const updateModalState = useCallback((newState: Partial<ModalState>) => {
    setModalState((prevState) => {
      const mergedState = cloneDeep(deepmerge(prevState, newState, { arrayMerge: (_prevState, newState) => newState }));
      return mergedState;
    });
  }, []);

  // Listen for external state updates
  useEffect(() => {
    stateListener.on("STATE_UPDATED", (newModalState: Partial<ModalState>) => {
      log.debug("state updated", newModalState);
      updateModalState(newModalState);
    });
    stateListener.emit("MOUNTED");
  }, [stateListener, updateModalState]);

  // Update visibility when initialVisibility changes
  useEffect(() => {
    setModalState((prev) => ({ ...prev, modalVisibility: initialVisibility }));
  }, [initialVisibility]);

  const value = useMemo(
    () => ({
      modalState,
      setModalState,
      updateModalState,
    }),
    [modalState, updateModalState]
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
