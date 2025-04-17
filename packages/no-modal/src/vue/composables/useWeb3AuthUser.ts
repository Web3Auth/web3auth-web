import { Ref, ref, watch } from "vue";

import { type UserInfo, WalletInitializationError, Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthUser {
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  userInfo: Ref<Partial<UserInfo> | null>;
  isMFAEnabled: Ref<boolean>;
  getUserInfo: () => Promise<Partial<UserInfo> | null>;
}

export const useWeb3AuthUser = (): IUseWeb3AuthUser => {
  const { web3Auth, isConnected, isMFAEnabled, setIsMFAEnabled } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const userInfo = ref<Partial<UserInfo> | null>(null);

  const getUserInfo = async () => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      const result = await web3Auth.value.getUserInfo();
      userInfo.value = result;
      return result;
    } catch (err) {
      error.value = err as Web3AuthError;
    } finally {
      loading.value = false;
    }
  };

  watch(
    isConnected,
    async (newIsConnected) => {
      if (newIsConnected && !userInfo.value) {
        const result = await getUserInfo();
        userInfo.value = result;
        setIsMFAEnabled(result?.isMfaEnabled || false);
      }

      if (!newIsConnected && userInfo.value) {
        userInfo.value = null;
        setIsMFAEnabled(false);
      }
    },
    { immediate: true }
  );

  return {
    loading,
    error,
    userInfo,
    isMFAEnabled,
    getUserInfo,
  };
};
