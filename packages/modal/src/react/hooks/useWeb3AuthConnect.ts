import type { Connection, LoginParamMap, WALLET_CONNECTOR_TYPE, Web3AuthError } from "@web3auth/no-modal";
import { useWeb3AuthConnect as useSharedWeb3AuthConnect } from "@web3auth/no-modal/react";
import { useCallback, useState } from "react";

import { useWeb3AuthInner } from "../hooks/useWeb3AuthInner";

export interface IUseWeb3AuthConnect {
  isConnected: boolean;
  loading: boolean;
  error: Web3AuthError | null;
  connectorName: WALLET_CONNECTOR_TYPE | null;
  connect(): Promise<Connection | null>;
  connectTo<T extends WALLET_CONNECTOR_TYPE>(connector: T, params?: LoginParamMap[T]): Promise<Connection | null>;
}

export const useWeb3AuthConnect = (): IUseWeb3AuthConnect => {
  const { web3Auth } = useWeb3AuthInner();
  const { isConnected, loading: sharedLoading, error: sharedError, connectorName, connect: sharedConnectTo } = useSharedWeb3AuthConnect();

  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<Web3AuthError | null>(null);
  const [activeFlow, setActiveFlow] = useState<"connect" | "connectTo" | null>(null);

  const connect = useCallback(async () => {
    setActiveFlow("connect");
    setConnectLoading(true);
    setConnectError(null);
    let connection: Connection | null = null;
    try {
      connection = await web3Auth.connect();
    } catch (error) {
      setConnectError(error as Web3AuthError);
    } finally {
      setConnectLoading(false);
    }
    return connection;
  }, [web3Auth]);

  const connectTo = useCallback(
    async <T extends WALLET_CONNECTOR_TYPE>(connector: T, params?: LoginParamMap[T]) => {
      setActiveFlow("connectTo");
      setConnectError(null);
      return sharedConnectTo(connector, params);
    },
    [sharedConnectTo]
  );

  return {
    isConnected,
    loading: connectLoading || sharedLoading,
    error: activeFlow === "connect" ? connectError : sharedError,
    connectorName: connectorName,
    connect,
    connectTo,
  };
};
