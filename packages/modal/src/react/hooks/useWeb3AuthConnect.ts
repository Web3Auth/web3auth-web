import type { IProvider, WALLET_CONNECTOR_TYPE, Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useEffect, useState } from "react";

import { useWeb3AuthInner } from "../hooks/useWeb3AuthInner";

export interface IUseWeb3AuthConnect {
  isConnected: boolean;
  loading: boolean;
  error: Web3AuthError | null;
  connectorName: WALLET_CONNECTOR_TYPE | null;
  connect(): Promise<IProvider | null>;
}

export const useWeb3AuthConnect = (): IUseWeb3AuthConnect => {
  const { web3Auth, isConnected } = useWeb3AuthInner();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Web3AuthError | null>(null);
  const [connectorName, setConnectorName] = useState<WALLET_CONNECTOR_TYPE | null>(null);

  useEffect(() => {
    if (!web3Auth) return;
    if (!isConnected && connectorName) {
      setConnectorName(null);
    }
    if (isConnected && !connectorName) {
      setConnectorName(web3Auth.connectedConnectorName);
    }
  }, [isConnected, connectorName, web3Auth]);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = await web3Auth.connect();
      if (provider) {
        setConnectorName(web3Auth.connectedConnectorName);
      }
      return provider;
    } catch (error) {
      setError(error as Web3AuthError);
    } finally {
      setLoading(false);
    }
  }, [web3Auth]);

  return {
    isConnected,
    loading,
    error,
    connectorName,
    connect,
  };
};
