import { Ref, ref } from "vue";

import { type ConnectedAccountInfo, log, WalletInitializationError, Web3AuthError } from "../base";
import { useWeb3AuthInner } from "../vue/composables/useWeb3AuthInner";
import { makeAccountLinkingRequest, makeAccountUnlinkingRequest } from "./index";
import type { LinkAccountParams, LinkAccountResult, LinkedAccountInfo, UnlinkAccountResult } from "./interfaces";

export { makeAccountLinkingRequest, makeAccountUnlinkingRequest };
export type {
  CITADEL_NETWORK,
  CitadelLinkAccountPayload,
  LinkAccountParams,
  LinkAccountResult,
  LinkedAccountInfo,
  UnlinkAccountPayload,
  UnlinkAccountResult,
} from "./interfaces";

export interface IUseLinkAccount {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  linkedAccounts: Ref<LinkedAccountInfo[]>;
  linkAccount(params: LinkAccountParams): Promise<LinkAccountResult | void>;
  unlinkAccount(address: string): Promise<UnlinkAccountResult | void>;
}

export interface IUseSwitchAccount {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  switchAccount(account: ConnectedAccountInfo): Promise<void>;
}

export interface IUseWallets {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  wallets: Ref<ConnectedAccountInfo[]>;
  getWallets(): Promise<void>;
}

export const useLinkAccount = (): IUseLinkAccount => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const linkedAccounts = ref<LinkedAccountInfo[]>([]);

  const linkAccount = async (params: LinkAccountParams): Promise<LinkAccountResult | void> => {
    if (!web3Auth.value) throw WalletInitializationError.notReady();
    try {
      error.value = null;
      loading.value = true;
      const result = await web3Auth.value.linkAccount(params);
      linkedAccounts.value = result.linkedAccounts;
      return result;
    } catch (err) {
      log.error("Error linking account", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  const unlinkAccount = async (address: string): Promise<UnlinkAccountResult | void> => {
    if (!web3Auth.value) throw WalletInitializationError.notReady();
    try {
      error.value = null;
      loading.value = true;
      const result = await web3Auth.value.unlinkAccount(address);
      linkedAccounts.value = result.linkedAccounts;
      return result;
    } catch (err) {
      log.error("Error unlinking account", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    linkAccount,
    unlinkAccount,
    linkedAccounts,
  };
};

export const useSwitchAccount = (): IUseSwitchAccount => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);

  const switchAccount = async (account: ConnectedAccountInfo): Promise<void> => {
    if (!web3Auth.value) throw WalletInitializationError.notReady();
    error.value = null;
    loading.value = true;
    try {
      await web3Auth.value.switchAccount(account);
    } catch (err) {
      log.error("Error switching account", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    switchAccount,
  };
};

export const useWallets = (): IUseWallets => {
  const { web3Auth } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const wallets = ref<ConnectedAccountInfo[]>([]);

  const getWallets = async (): Promise<void> => {
    if (!web3Auth.value) throw WalletInitializationError.notReady();
    error.value = null;
    loading.value = true;
    try {
      const result = await web3Auth.value.getConnectedAccounts();
      wallets.value = result;
    } catch (err) {
      log.error("Error getting wallets", err);
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    wallets,
    getWallets,
  };
};
