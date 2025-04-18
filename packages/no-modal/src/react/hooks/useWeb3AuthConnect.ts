import { useCallback, useEffect, useState } from "react";

import { IProvider, LoginParamMap, WALLET_CONNECTOR_TYPE, Web3AuthError } from "../../base";
import { useWeb3AuthInner } from "../hooks/useWeb3AuthInner";

export interface IUseWeb3AuthConnect {
  isConnected: boolean;
  loading: boolean;
  error: Web3AuthError | null;
  connectorName: WALLET_CONNECTOR_TYPE | null;
  connect<T extends WALLET_CONNECTOR_TYPE>(connector: T, params?: LoginParamMap[T]): Promise<IProvider | null>;
}

export const useWeb3AuthConnect = (): IUseWeb3AuthConnect => {
  const context = useWeb3AuthInner();
  const { web3Auth, isConnected } = context;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [connectorName, setConnectorName] = useState<WALLET_CONNECTOR_TYPE | null>(null);

  useEffect(() => {
    if (!isConnected && connectorName) {
      setConnectorName(null);
    }
    if (isConnected && !connectorName) {
      setConnectorName(web3Auth.connectedConnectorName);
    }
  }, [isConnected, connectorName]);

  const connect = useCallback(
    async <T extends WALLET_CONNECTOR_TYPE>(connector: T, params?: LoginParamMap[T]) => {
      setLoading(true);
      setError(null);
      try {
        const provider = await web3Auth.connectTo(connector, params);
        if (provider) {
          setConnectorName(web3Auth.connectedConnectorName);
        }
        return provider;
      } catch (error) {
        setError(error as Web3AuthError);
      } finally {
        setLoading(false);
      }
    },
    [web3Auth]
  );

  return {
    isConnected,
    loading,
    error,
    connectorName,
    connect,
  };
};
