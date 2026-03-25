import { useCallback, useState } from "react";

import { ChainNamespaceType, Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "../hooks/useWeb3AuthInner";

export interface IUseSwitchChain {
  loading: boolean;
  error: Web3AuthError | null;
  switchChain: (params: { chainId: string; namespace: ChainNamespaceType }) => Promise<void>;
}

export const useSwitchChain = (): IUseSwitchChain => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const switchChain = useCallback(
    async (params: { chainId: string; namespace: ChainNamespaceType }) => {
      setLoading(true);
      setError(null);
      try {
        await web3Auth.switchChain(params);
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
