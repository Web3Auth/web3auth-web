import { Ref, ref } from "vue";

import {
  type LinkAccountParams,
  type LinkAccountResult,
  LinkedAccountInfo,
  log,
  UnlinkAccountResult,
  WalletInitializationError,
  Web3AuthError,
} from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseLinkAccount {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  linkedAccounts: Ref<LinkedAccountInfo[]>;
  linkAccount(params: LinkAccountParams): Promise<LinkAccountResult | void>;
  unlinkAccount(address: string): Promise<UnlinkAccountResult | void>;
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
