import { type LinkAccountParams, type LinkAccountResult, Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseLinkAccount {
  loading: boolean;
  error: Web3AuthError | null;
  linkAccount(params: LinkAccountParams): Promise<LinkAccountResult | void>;
}

export const useLinkAccount = (): IUseLinkAccount => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const linkAccount = useCallback(
    async (params: LinkAccountParams): Promise<LinkAccountResult | void> => {
      setLoading(true);
      setError(null);
      try {
        return await web3Auth.linkAccount(params);
      } catch (err) {
        setError(err as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  return { loading, error, linkAccount };
};
