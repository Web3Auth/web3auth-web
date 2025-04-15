import { Web3AuthProvider as Web3AuthProviderNoModal } from "@web3auth/no-modal/react";
import { createElement, PropsWithChildren } from "react";

import { Web3AuthInnerProvider } from "./context/Web3AuthInnerContext";
import { Web3AuthProviderProps } from "./interfaces";

export function Web3AuthProvider({ config, children }: PropsWithChildren<Web3AuthProviderProps>) {
  return createElement(Web3AuthInnerProvider, { config }, createElement(Web3AuthProviderNoModal, { config }, children));
}
