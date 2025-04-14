import { useCallback, useState } from "react";

import { Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "../hooks/useWeb3AuthInner";

export interface IUseSwitchChain {
  switchingChain: boolean;
  switchingChainError: Web3AuthError | null;
  switchChain: (chainId: string) => Promise<void>;
}

export const useSwitchChain = (): IUseSwitchChain => {
  const { web3Auth } = useWeb3AuthInner();

  const [switchingChain, setSwitchingChain] = useState(false);
  const [switchingChainError, setSwitchingChainError] = useState<Web3AuthError | null>(null);

  const switchChain = useCallback(
    async (chainId: string) => {
      setSwitchingChain(true);
      setSwitchingChainError(null);
      try {
        await web3Auth.switchChain({ chainId });
      } catch (error) {
        setSwitchingChainError(error as Web3AuthError);
      } finally {
        setSwitchingChain(false);
      }
    },
    [web3Auth]
  );

  return { switchingChain, switchingChainError, switchChain };
};
