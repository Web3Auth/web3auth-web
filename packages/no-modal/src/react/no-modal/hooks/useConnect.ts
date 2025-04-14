import { useCallback, useState } from "react";

import { IProvider, WALLET_CONNECTOR_TYPE, Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "../hooks/useWeb3AuthInner";

export interface IUseConnect {
  connecting: boolean;
  connectingError: Web3AuthError | null;
  connectorName: WALLET_CONNECTOR_TYPE | null;
  connect<T>(connector: WALLET_CONNECTOR_TYPE, params?: T): Promise<IProvider | null>;
}

export const useConnect = (): IUseConnect => {
  const context = useWeb3AuthInner();
  const { web3Auth } = context;

  const [connecting, setConnecting] = useState(false);
  const [connectingError, setConnectingError] = useState<Web3AuthError | null>(null);
  const [connectorName, setConnectorName] = useState<WALLET_CONNECTOR_TYPE | null>(null);

  const connect = useCallback(
    async <T>(connector: WALLET_CONNECTOR_TYPE, params?: T) => {
      setConnecting(true);
      setConnectingError(null);
      setConnectorName(connector);
      try {
        const provider = await web3Auth.connectTo<T>(connector, params);
        return provider;
      } catch (error) {
        setConnectingError(error as Web3AuthError);
      } finally {
        setConnecting(false);
      }
    },
    [web3Auth]
  );

  return {
    connecting,
    connectorName,
    connectingError,
    connect,
  };
};
