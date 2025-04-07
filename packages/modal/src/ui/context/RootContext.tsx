import { createContext, Dispatch, SetStateAction } from "react";

import { ExternalButton } from "../interfaces";

export type BodyState = {
  showWalletDetails?: boolean;
  showMultiChainSelector?: boolean;
  walletDetails?: ExternalButton;
};

export type RootContextType = {
  bodyState: BodyState;
  setBodyState: Dispatch<SetStateAction<BodyState>>;
};

export const RootContext = createContext<RootContextType>({
  bodyState: {
    showWalletDetails: false,
    walletDetails: null,
    showMultiChainSelector: false,
  },
  setBodyState: () => {},
});
