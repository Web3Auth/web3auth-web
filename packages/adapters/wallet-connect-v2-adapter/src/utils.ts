import type { EngineTypes } from "@walletconnect/types";
import type { ChainNamespaceType } from "@web3auth/base";

export const isChainIdSupported = (chainNamespace: ChainNamespaceType, chainID: number, loginSettings: EngineTypes.ConnectParams | undefined) => {
  const supportedNamespaces = loginSettings?.requiredNamespaces || {};
  const wcChainNamespace = `${chainNamespace}:${chainID}`;

  if (!supportedNamespaces[chainNamespace].chains || supportedNamespaces[chainNamespace].chains?.length === 0) {
    return false;
  }
  const isSupported = supportedNamespaces[chainNamespace].chains?.includes(wcChainNamespace);
  return !!isSupported;
};
