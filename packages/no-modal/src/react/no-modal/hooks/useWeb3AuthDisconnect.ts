import { useCallback, useState } from "react";

import { Web3AuthError } from "@/core/base";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthDisconnect {
  disconnecting: boolean;
  disconnectingError: Web3AuthError | null;
  disconnect(options?: { cleanup: boolean }): Promise<void>;
}

export const useWeb3AuthDisconnect = (): IUseWeb3AuthDisconnect => {
  const context = useWeb3AuthInner();
  const { web3Auth } = context;

  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectingError, setDisconnectingError] = useState<Web3AuthError | null>(null);

  const disconnect = useCallback(
    async (options?: { cleanup: boolean }) => {
      setDisconnecting(true);
      setDisconnectingError(null);
      try {
        await web3Auth.logout(options);
      } catch (error) {
        setDisconnectingError(error as Web3AuthError);
      } finally {
        setDisconnecting(false);
      }
    },
    [web3Auth]
  );

  return { disconnecting, disconnectingError, disconnect };
};
