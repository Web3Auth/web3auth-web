import { createContext, type Dispatch, type FC, type ReactNode, type SetStateAction, useContext, useMemo, useState } from "react";

import { ExternalButton, TOAST_TYPE, ToastType } from "../interfaces";

export type BodyState = {
  installLinks?: {
    show: boolean;
    wallet: ExternalButton;
  };
  multiChainSelector: {
    show: boolean;
    wallet: ExternalButton;
  };
  // Pre-selected wallet to show QR code directly when navigating to ConnectWallet page
  preSelectedWallet?: ExternalButton;
};

export type ToastState = {
  message: string;
  type: ToastType;
};

export const initialBodyState: BodyState = {
  installLinks: {
    show: false,
    wallet: null,
  },
  multiChainSelector: {
    show: false,
    wallet: null,
  },
  preSelectedWallet: null,
};

export const initialToastState: ToastState = {
  message: "",
  type: TOAST_TYPE.SUCCESS,
};

type RootContextType = {
  bodyState: BodyState;
  setBodyState: Dispatch<SetStateAction<BodyState>>;
  toast: ToastState;
  setToast: Dispatch<SetStateAction<ToastState>>;
};

type RootProviderProps = {
  children: ReactNode;
};

const RootContext = createContext<RootContextType | undefined>(undefined);

export const RootProvider: FC<RootProviderProps> = ({ children }) => {
  const [bodyState, setBodyState] = useState<BodyState>(initialBodyState);
  const [toast, setToast] = useState<ToastState>(initialToastState);

  const value = useMemo(
    () => ({
      bodyState,
      setBodyState,
      toast,
      setToast,
    }),
    [bodyState, toast]
  );

  return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

export const useRoot = () => {
  const context = useContext(RootContext);
  if (!context) {
    throw new Error("useRoot must be used within a RootProvider");
  }
  return context;
};

export const useBodyState = () => {
  const { bodyState, setBodyState } = useRoot();
  return { bodyState, setBodyState };
};

export const useToast = () => {
  const { toast, setToast } = useRoot();
  return { toast, setToast };
};
