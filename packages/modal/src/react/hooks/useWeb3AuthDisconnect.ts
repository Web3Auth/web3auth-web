import { Web3AuthError } from "@web3auth/no-modal";
import { useCallback, useState } from "react";

import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3AuthDisconnect {
  disconnecting: boolean;
  disconnectingError: Web3AuthError | null;
  disconnect(options?: { cleanup: boolean }): Promise<void>;
}

export const useWeb3AuthDisconnect = (): IUseWeb3AuthDisconnect => {
  const { web3Auth } = useWeb3AuthInner();

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
