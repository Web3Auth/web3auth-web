import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import type { Wallet } from "@wallet-standard/base";
import { CHAIN_NAMESPACES } from "@web3auth/no-modal";
import { useEffect, useMemo, useState } from "react";

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
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { connection, web3Auth } = useWeb3Auth();
  const { chainNamespace } = useChain();
  const [accounts, setAccounts] = useState<string[] | null>(null);

  const solanaWallet = useMemo(() => {
    if (chainNamespace !== CHAIN_NAMESPACES.SOLANA) return null;
    return connection?.solanaWallet ?? null;
  }, [connection, chainNamespace]);

  const rpc = useMemo(() => {
    if (!web3Auth || !solanaWallet || chainNamespace !== CHAIN_NAMESPACES.SOLANA) return null;
    return createSolanaRpc(web3Auth.currentChain.rpcTarget);
  }, [web3Auth, solanaWallet, chainNamespace]);

  useEffect(() => {
    if (chainNamespace !== CHAIN_NAMESPACES.SOLANA || !solanaWallet) {
      setAccounts(null);
      return;
    }
    const accts = solanaWallet.accounts.map((a) => a.address);
    if (accts.length > 0) setAccounts(accts);
  }, [solanaWallet, chainNamespace]);

  return { solanaWallet, accounts, rpc };
};
