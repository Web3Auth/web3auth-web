import { createContext, Dispatch, SetStateAction } from "react";

import { ExternalButton, TOAST_TYPE, ToastType } from "../interfaces";

export type BodyState = {
  showWalletDetails: boolean;
  walletDetails?: ExternalButton;
};

export type ToastState = {
  message: string;
  type: ToastType;
};

export type RootContextType = {
  bodyState: BodyState;
  setBodyState: Dispatch<SetStateAction<BodyState>>;
  toast: ToastState;
  setToast: Dispatch<SetStateAction<ToastState>>;
};

export const RootContext = createContext<RootContextType>({
  bodyState: {
    showWalletDetails: false,
    walletDetails: null,
  },
  toast: {
    message: "",
    type: TOAST_TYPE.SUCCESS,
  },
  setBodyState: () => {},
  setToast: () => {},
});
