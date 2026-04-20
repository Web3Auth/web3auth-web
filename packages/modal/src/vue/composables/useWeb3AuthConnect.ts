import { Connection, log, LoginParamMap, WALLET_CONNECTOR_TYPE, WalletInitializationError, Web3AuthError } from "@web3auth/no-modal";
import { useWeb3AuthConnect as useWeb3AuthNoModalConnect } from "@web3auth/no-modal/vue";
import { Ref, ref, watch } from "vue";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthConnect {
  isConnected: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<Web3AuthError | null>;
  connectorName: Ref<WALLET_CONNECTOR_TYPE | null>;
  connect(): Promise<Connection | null>;
  connectTo<T extends WALLET_CONNECTOR_TYPE>(connector: T, params?: LoginParamMap[T]): Promise<Connection | null>;
}

export const useWeb3AuthConnect = (): IUseWeb3AuthConnect => {
  const { web3Auth } = useWeb3AuthInner();
  // Web3AuthModal extends the NoModal class, so we can use the same composable
  const { isConnected, loading: sharedLoading, error: sharedError, connectorName, connect: sharedConnectTo } = useWeb3AuthNoModalConnect();
  const loading = ref(false);
  const error = ref<Web3AuthError | null>(null);
  const connectLoading = ref(false);
  const connectError = ref<Web3AuthError | null>(null);
  const activeFlow = ref<"connect" | "connectTo" | null>(null);

  watch(
    [connectLoading, sharedLoading],
    ([newConnectLoading, newSharedLoading]) => {
      loading.value = newConnectLoading || newSharedLoading;
    },
    { immediate: true }
  );

  watch(
    [activeFlow, connectError, sharedError],
    ([newActiveFlow, newConnectError, newSharedError]) => {
      error.value = newActiveFlow === "connect" ? newConnectError : newSharedError;
    },
    { immediate: true }
  );

  const connect = async () => {
    try {
      activeFlow.value = "connect";
      if (!web3Auth.value) throw WalletInitializationError.notReady();
      connectError.value = null;
      connectLoading.value = true;
      const localProvider = await web3Auth.value.connect();
      return localProvider;
    } catch (err) {
      log.error("Error connecting", err);
      connectError.value = err as Web3AuthError;
      return null;
    } finally {
      connectLoading.value = false;
    }
  };

  const connectTo = async <T extends WALLET_CONNECTOR_TYPE>(connectorType: T, loginParams?: LoginParamMap[T]) => {
    activeFlow.value = "connectTo";
    connectError.value = null;
    return sharedConnectTo(connectorType, loginParams);
  };

  return {
    isConnected,
    loading,
    error,
    connectorName,
    connect,
    connectTo,
  };
};
