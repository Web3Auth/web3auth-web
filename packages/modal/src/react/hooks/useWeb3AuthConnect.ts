import type { IProvider, WALLET_CONNECTOR_TYPE, Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useWeb3AuthInner } from "../hooks/useWeb3AuthInner";

export interface IUseWeb3AuthConnect {
  connecting: boolean;
  connectingError: Web3AuthError | null;
  connectorName: WALLET_CONNECTOR_TYPE | null;
  connect(): Promise<IProvider | null>;
}

export const useWeb3AuthConnect = (): IUseWeb3AuthConnect => {
  const context = useWeb3AuthInner();
  const { web3Auth } = context;

  const [connecting, setConnecting] = useState(false);
  const [connectingError, setConnectingError] = useState<Web3AuthError | null>(null);
  const [connectorName, setConnectorName] = useState<WALLET_CONNECTOR_TYPE | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setConnectingError(null);
    try {
      const provider = await web3Auth.connect();
      if (provider) {
        setConnectorName(web3Auth.connectedConnectorName);
      }
      return provider;
    } catch (error) {
      setConnectingError(error as Web3AuthError);
    } finally {
      setConnecting(false);
    }
  }, [web3Auth]);

  return {
    connecting,
    connectorName,
    connectingError,
    connect,
  };
};
