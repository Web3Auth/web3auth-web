import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import type { Wallet } from "@wallet-standard/base";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CHAIN_NAMESPACES } from "../../../base/chain/IChainInterface";
import { WALLET_CONNECTORS } from "../../../base/wallet";
import { useChain } from "../../hooks";
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
  const solanaChain = useChain(CHAIN_NAMESPACES.SOLANA);
  const [accounts, setAccounts] = useState<string[] | null>(null);

  const solanaWallet = useMemo(() => {
    if (!solanaChain) return null;
    return connection?.solanaWallet ?? null;
  }, [connection, solanaChain]);

  const rpc = useMemo(() => {
    if (!web3Auth || !solanaWallet || !solanaChain) return null;
    return createSolanaRpc(solanaChain.rpcTarget);
  }, [web3Auth, solanaWallet, solanaChain]);

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

  useEffect(() => {
    if (!solanaChain || !solanaWallet) {
      setAccounts(null);
      return;
    }
    const accts = solanaWallet.accounts.map((a) => a.address);
    if (accts.length > 0) setAccounts(accts);
  }, [solanaWallet, solanaChain]);

  return { solanaWallet, accounts, rpc, getPrivateKey };
};
