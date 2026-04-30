import { useCallback, useState } from "react";

import {
  type LinkAccountParams,
  type LinkAccountResult,
  LinkedAccountInfo,
  UnlinkAccountResult,
  WalletInitializationError,
  Web3AuthError,
} from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseLinkAccount {
  loading: boolean;
  error: Web3AuthError | null;
  linkedAccounts: LinkedAccountInfo[];
  linkAccount(params?: LinkAccountParams): Promise<LinkAccountResult | void>;
  unlinkAccount(address: string): Promise<UnlinkAccountResult | void>;
}

export const useLinkAccount = (): IUseLinkAccount => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountInfo[]>([]);

  const linkAccount = useCallback(
    async (params?: LinkAccountParams): Promise<LinkAccountResult | void> => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      setLoading(true);
      setError(null);
      try {
        const result = await web3Auth.linkAccount(params);
        setLinkedAccounts(result.linkedAccounts);
        return result;
      } catch (err) {
        setError(err as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  const unlinkAccount = useCallback(
    async (address: string): Promise<UnlinkAccountResult | void> => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      setLoading(true);
      setError(null);
      try {
        const result = await web3Auth.unlinkAccount(address);
        setLinkedAccounts(result.linkedAccounts);
        return result;
      } catch (err) {
        setError(err as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  return { loading, error, linkAccount, unlinkAccount, linkedAccounts };
};
