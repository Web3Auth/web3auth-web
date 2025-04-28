import { useCallback, useState } from "react";

import { Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "../hooks/useWeb3AuthInner";

export interface IUseSwitchChain {
  loading: boolean;
  error: Web3AuthError | null;
  switchChain: (chainId: string) => Promise<void>;
}

export const useSwitchChain = (): IUseSwitchChain => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const switchChain = useCallback(
    async (chainId: string) => {
      setLoading(true);
      setError(null);
      try {
        await web3Auth.switchChain({ chainId });
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  return { loading, error, switchChain };
};
