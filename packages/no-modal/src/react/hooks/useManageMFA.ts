import { useCallback, useState } from "react";

import { Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseManageMFA {
  loading: boolean;
  error: Web3AuthError | null;
  manageMFA<T>(params?: T): Promise<void>;
}

export const useManageMFA = (): IUseManageMFA => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const manageMFA = useCallback(
    async <T>(params: T) => {
      setLoading(true);
      setError(null);
      try {
        await web3Auth.manageMFA(params);
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  return { loading, error, manageMFA };
};
