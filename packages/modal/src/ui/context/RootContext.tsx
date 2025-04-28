import { createContext, Dispatch, SetStateAction } from "react";

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
  metamaskQrCode: {
    show: boolean;
    wallet: ExternalButton;
  };
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
    metamaskQrCode: {
      show: false,
      wallet: null,
    },
    installLinks: {
      show: false,
      wallet: null,
    },
    multiChainSelector: {
      show: false,
      wallet: null,
    },
  },
  toast: {
    message: "",
    type: TOAST_TYPE.SUCCESS,
  },
  setBodyState: () => {},
  setToast: () => {},
});
