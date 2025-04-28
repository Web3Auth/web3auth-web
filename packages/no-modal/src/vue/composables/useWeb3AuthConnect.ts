import { Ref, ref, watch } from "vue";

import { IProvider, LoginParamMap, WALLET_CONNECTOR_TYPE, WalletInitializationError, Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthConnect {
  isConnected: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  connectorName: Ref<WALLET_CONNECTOR_TYPE | null>;
  connect: <T extends WALLET_CONNECTOR_TYPE>(connectorType: T, loginParams?: LoginParamMap[T]) => Promise<IProvider | null>;
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
      if (newVal && !connectorName.value) {
        connectorName.value = web3Auth.value?.connectedConnectorName;
      }
    },
    { immediate: true }
  );

  const connect = async <T extends WALLET_CONNECTOR_TYPE>(connectorType: T, loginParams?: LoginParamMap[T]) => {
    try {
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      error.value = null;
      loading.value = true;
      const localProvider = await web3Auth.value.connectTo(connectorType, loginParams);
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
