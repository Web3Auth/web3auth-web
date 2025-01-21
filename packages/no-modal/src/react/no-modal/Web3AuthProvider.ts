// eslint-disable-next-line import/no-extraneous-dependencies
import { createElement, type PropsWithChildren } from "react";

import { Web3AuthProviderProps } from "./interfaces";
import { Web3AuthInnerProvider } from "./Web3AuthInnerContext";

export function Web3AuthProvider({ config, children }: PropsWithChildren<Web3AuthProviderProps>) {
  return createElement(Web3AuthInnerProvider, { config }, children);
}
