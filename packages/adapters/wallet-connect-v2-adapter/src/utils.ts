import type { EngineTypes } from "@walletconnect/types";

export const isChainIdSupported = (chainNamespace: string, chainID: number, loginSettings: EngineTypes.ConnectParams | undefined) => {
  const supportedNamespaces = loginSettings ? loginSettings.requiredNamespaces || {} : {};
  const wcChainNamespace = `${chainNamespace}:${chainID}`;

  if (!supportedNamespaces[chainNamespace].chains || supportedNamespaces[chainNamespace].chains?.length === 0) {
    return false;
  }
  const isSupported = supportedNamespaces[chainNamespace].chains?.includes(wcChainNamespace);
  return !!isSupported;
};
