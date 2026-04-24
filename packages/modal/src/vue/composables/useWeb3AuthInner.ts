import { useInjectedWeb3AuthInnerContext } from "@web3auth/no-modal/vue";

import { IWeb3AuthInnerContext } from "../interfaces";

export const useWeb3AuthInner = (): IWeb3AuthInnerContext => {
  return useInjectedWeb3AuthInnerContext<IWeb3AuthInnerContext>();
};
