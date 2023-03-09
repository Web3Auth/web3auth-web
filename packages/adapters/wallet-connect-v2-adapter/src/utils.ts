import type { EngineTypes } from "@walletconnect/types";
import { CustomChainConfig } from "@web3auth/base";

export const supportsSwitchChainRpc = (currentChainConfig: CustomChainConfig, loginSettings: EngineTypes.ConnectParams | undefined) => {
  const supportedNamespaces = loginSettings ? loginSettings.requiredNamespaces || {} : {};
  const wcChainNamespace = `${currentChainConfig.chainNamespace}:${parseInt(currentChainConfig.chainId || "0x1", 16)}`;

  const namespaceMethods = supportedNamespaces[wcChainNamespace] || [];

  if (namespaceMethods.methods.includes("wallet_switchEthereumChain")) {
    return true;
  }
  return false;
};

export const supportsAddChainRpc = (currentChainConfig: CustomChainConfig, loginSettings: EngineTypes.ConnectParams | undefined) => {
  const supportedNamespaces = loginSettings ? loginSettings.requiredNamespaces || {} : {};
  const wcChainNamespace = `${currentChainConfig.chainNamespace}:${parseInt(currentChainConfig.chainId || "0x1", 16)}`;

  const namespaceMethods = supportedNamespaces[wcChainNamespace] || [];

  if (namespaceMethods.methods.includes("wallet_addEthereumChain")) {
    return true;
  }
  return false;
};
