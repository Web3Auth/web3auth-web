import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import type { Wallet } from "@wallet-standard/base";
import { CHAIN_NAMESPACES, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useChain } from "../../hooks/useChain";
import { useWeb3Auth } from "../../hooks/useWeb3Auth";

export type IUseSolanaWallet = {
  accounts: string[] | null;
  solanaWallet: Wallet | null;
  /**
   * Solana RPC client for making RPC calls.
   * @example
   * ```typescript
   * const { value: balance } = await rpc.getBalance(address("...")).send();
   * const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
   * ```
   */
  rpc: Rpc<SolanaRpcApi> | null;
  /**
   * Returns the Solana ed25519 private key. Only works with the Auth connector.
   * @throws Error if connected via a non-Auth connector or if the provider is unavailable.
   */
  getPrivateKey: () => Promise<string>;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { connection, web3Auth } = useWeb3Auth();
  const { chainNamespace } = useChain();
  const [solanaWallet, setSolanaWallet] = useState<Wallet | null>(null);
  const [accounts, setAccounts] = useState<string[] | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- intentional */
  useEffect(() => {
    if (!connection?.solanaWallet) {
      setSolanaWallet(null);
      setAccounts(null);
      return;
    }
    setSolanaWallet((prev) => {
      const shouldSetup = prev === null || chainNamespace === CHAIN_NAMESPACES.SOLANA;
      if (!shouldSetup) return prev;
      return connection.solanaWallet;
    });
  }, [connection, chainNamespace]);

  useEffect(() => {
    if (!solanaWallet) {
      setAccounts(null);
      return;
    }
    const accts = solanaWallet.accounts.map((a) => a.address);
    setAccounts(accts.length > 0 ? accts : null);
  }, [solanaWallet]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const rpc = useMemo(() => {
    if (!web3Auth?.currentChain?.rpcTarget || !solanaWallet || chainNamespace !== CHAIN_NAMESPACES.SOLANA) {
      return null;
    }
    return createSolanaRpc(web3Auth.currentChain.rpcTarget);
  }, [web3Auth, solanaWallet, chainNamespace]);

  const getPrivateKey = useCallback(async (): Promise<string> => {
    if (!web3Auth) throw new Error("Web3Auth not initialized");
    if (connection?.connectorName !== WALLET_CONNECTORS.AUTH) {
      throw new Error("getPrivateKey is only supported with the Auth connector");
    }
    const provider = web3Auth.connectedConnector?.provider;
    if (!provider) throw new Error("Provider not available");
    const privateKey = await provider.request<never, string>({ method: SOLANA_METHOD_TYPES.SOLANA_PRIVATE_KEY });
    if (!privateKey) throw new Error("Failed to retrieve private key");
    return privateKey;
  }, [web3Auth, connection]);

  return { solanaWallet, accounts, rpc, getPrivateKey };
};
