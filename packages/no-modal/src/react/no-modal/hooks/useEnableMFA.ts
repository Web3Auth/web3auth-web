import { useCallback, useState } from "react";

import { Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseEnableMFA {
  isLoading: boolean;
  error: Web3AuthError | null;
  enableMFA<T>(params: T): Promise<void>;
}

export const useEnableMFA = (): IUseEnableMFA => {
  const { web3Auth } = useWeb3AuthInner();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const enableMFA = useCallback(
    async <T>(params: T) => {
      setIsLoading(true);
      setError(null);
      try {
        await web3Auth.enableMFA(params);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setIsLoading(false);
      }
    },
    [web3Auth]
  );

  return { isLoading, error, enableMFA };
};
