import type { EngineTypes } from "@walletconnect/types";

import type { ChainNamespaceType } from "@/core/base";

export const isChainIdSupported = (chainNamespace: ChainNamespaceType, chainID: number, loginSettings: EngineTypes.ConnectParams | undefined) => {
  const supportedNamespaces = { ...(loginSettings?.requiredNamespaces || {}), ...(loginSettings?.optionalNamespaces || {}) };
  const wcChainNamespace = `${chainNamespace}:${chainID}`;

  if (!supportedNamespaces[chainNamespace]?.chains || supportedNamespaces[chainNamespace]?.chains?.length === 0) {
    return false;
  }
  const isSupported = supportedNamespaces[chainNamespace].chains?.includes(wcChainNamespace);
  return !!isSupported;
};
