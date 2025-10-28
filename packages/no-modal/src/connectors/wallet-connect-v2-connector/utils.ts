import type { EngineTypes } from "@walletconnect/types";

import type { ChainNamespaceType } from "../../base";

export const isChainIdSupported = (chainNamespace: ChainNamespaceType, chainID: number, loginSettings: EngineTypes.ConnectParams | undefined) => {
  const supportedNamespaces = { ...(loginSettings?.requiredNamespaces || {}), ...(loginSettings?.optionalNamespaces || {}) };
  const wcChainNamespace = `${chainNamespace}:${chainID}`;

  if (!supportedNamespaces[chainNamespace]?.chains || supportedNamespaces[chainNamespace]?.chains?.length === 0) {
    return false;
  }
  const isSupported = supportedNamespaces[chainNamespace].chains?.includes(wcChainNamespace);
  return !!isSupported;
};

export const formatChainId = (chainId: number | string) => {
  if (typeof chainId === "number") {
    return `0x${chainId.toString(16)}`;
  } else if (typeof chainId === "string") {
    return chainId.startsWith("0x") ? chainId : `0x${parseInt(chainId, 10).toString(16)}`;
  }
  throw new Error(`Invalid chainId: ${chainId}`);
};
