import { IProvider, WALLET_CONNECTOR_TYPE, WalletInitializationError, Web3AuthError } from "@web3auth/no-modal";
import { Ref, ref, watch } from "vue";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthConnect {
  isConnected: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  connectorName: Ref<WALLET_CONNECTOR_TYPE | null>;
  connect(): Promise<IProvider | null>;
}

export const useWeb3AuthConnect = (): IUseWeb3AuthConnect => {
  const { web3Auth, isConnected } = useWeb3AuthInner();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const connectorName = ref<WALLET_CONNECTOR_TYPE | null>(null);

  watch(
    isConnected,
    (newVal) => {
      if (!newVal && connectorName.value) {
        connectorName.value = null;
      }
    },
    { immediate: true }
  );

  const connect = async () => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      const localProvider = await web3Auth.value.connect();
      connectorName.value = web3Auth.value.connectedConnectorName;
      return localProvider;
    } catch (err) {
      error.value = err as Web3AuthError;
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    isConnected,
    loading,
    error,
    connectorName,
    connect,
  };
};
