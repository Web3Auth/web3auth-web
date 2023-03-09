import type { EngineTypes } from "@walletconnect/types";
import { CustomChainConfig } from "@web3auth/base";

import { DEFAULT_EIP155_METHODS } from "./config";

export const supportsSwitchChainRpc = (currentChainConfig: CustomChainConfig, loginSettings: EngineTypes.ConnectParams | undefined) => {
  const supportedNamespaces = loginSettings ? loginSettings.requiredNamespaces || {} : {};
  const wcChainNamespace = `${currentChainConfig.chainNamespace}:${parseInt(currentChainConfig.chainId || "0x1", 16)}`;

  const namespaceMethods = supportedNamespaces[wcChainNamespace] || [];

  if (namespaceMethods.methods.includes(DEFAULT_EIP155_METHODS.SWITCH_CHAIN)) {
    return true;
  }
  return false;
};

export const supportsAddChainRpc = (currentChainConfig: CustomChainConfig, loginSettings: EngineTypes.ConnectParams | undefined) => {
  const supportedNamespaces = loginSettings ? loginSettings.requiredNamespaces || {} : {};
  const wcChainNamespace = `${currentChainConfig.chainNamespace}:${parseInt(currentChainConfig.chainId || "0x1", 16)}`;

  const namespaceMethods = supportedNamespaces[wcChainNamespace] || [];

  if (namespaceMethods.methods.includes(DEFAULT_EIP155_METHODS.ADD_CHAIN)) {
    return true;
  }
  return false;
};
