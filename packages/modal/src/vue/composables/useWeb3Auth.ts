import { useWeb3Auth as useWeb3AuthNoModal } from "@web3auth/no-modal/vue";

import { IWeb3AuthInnerContext } from "../interfaces";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export type IWeb3AuthModalContext = IWeb3AuthInnerContext;

export const useWeb3Auth = (): IWeb3AuthModalContext => {
  const context = useWeb3AuthInner();
  const noModalContext = useWeb3AuthNoModal();

  return {
    ...noModalContext,
    web3Auth: context.web3Auth,
    isMFAEnabled: context.isMFAEnabled,
    setIsMFAEnabled: context.setIsMFAEnabled,
  };
};
