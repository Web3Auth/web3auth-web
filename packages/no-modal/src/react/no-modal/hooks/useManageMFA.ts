import { useCallback, useState } from "react";

import { Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseManageMFA {
  isLoading: boolean;
  error: Web3AuthError | null;
  manageMFA<T>(params: T): Promise<void>;
}

export const useManageMFA = (): IUseManageMFA => {
  const { web3Auth } = useWeb3AuthInner();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const manageMFA = useCallback(
    async <T>(params: T) => {
      setIsLoading(true);
      setError(null);
      try {
        await web3Auth.manageMFA(params);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setIsLoading(false);
      }
    },
    [web3Auth]
  );

  return { isLoading, error, manageMFA };
};
