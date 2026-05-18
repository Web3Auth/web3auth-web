import { useCallback, useState } from "react";

import { type LinkedAccountInfo, WalletInitializationError, Web3AuthError } from "../base";
import { useWeb3AuthInner } from "../react/hooks/useWeb3AuthInner";
import { makeAccountLinkingRequest, makeAccountUnlinkingRequest } from "./index";
import type { BaseLinkedAccountInfo, LinkAccountParams, LinkAccountResult, UnlinkAccountResult } from "./interfaces";

export { makeAccountLinkingRequest, makeAccountUnlinkingRequest };
export type {
  CITADEL_NETWORK,
  CitadelLinkAccountPayload,
  LinkAccountParams,
  LinkAccountResult,
  BaseLinkedAccountInfo as LinkedAccountInfo,
  UnlinkAccountPayload,
  UnlinkAccountResult,
} from "./interfaces";

export interface IUseLinkAccount {
  loading: boolean;
  error: Web3AuthError | null;
  linkedAccounts: BaseLinkedAccountInfo[];
  linkAccount(params: LinkAccountParams): Promise<LinkAccountResult | void>;
  unlinkAccount(address: string): Promise<UnlinkAccountResult | void>;
}

export interface IUseSwitchAccount {
  loading: boolean;
  error: Web3AuthError | null;
  switchAccount(account: LinkedAccountInfo): Promise<void>;
}

export const useLinkAccount = (): IUseLinkAccount => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<BaseLinkedAccountInfo[]>([]);

  const linkAccount = useCallback(
    async (params: LinkAccountParams): Promise<LinkAccountResult | void> => {
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

export const useSwitchAccount = (): IUseSwitchAccount => {
  const { web3Auth } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);

  const switchAccount = useCallback(
    async (account: LinkedAccountInfo): Promise<void> => {
      if (!web3Auth) throw WalletInitializationError.notReady();
      setLoading(true);
      setError(null);
      try {
        await web3Auth.switchAccount(account);
      } catch (err) {
        setError(err as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  return { loading, error, switchAccount };
};
