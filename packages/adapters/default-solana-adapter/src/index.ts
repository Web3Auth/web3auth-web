import { IAdapter, IWeb3AuthCoreOptions } from "@web3auth/base";

import { getInjectedAdapters } from "./injectedAdapters";

export const getDefaultExternalAdapters = (params: { options: IWeb3AuthCoreOptions }): IAdapter<unknown>[] => {
  return getInjectedAdapters(params);
};

export { getInjectedAdapters };
