import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import { useEffect, useMemo, useState } from "react";

import { CHAIN_NAMESPACES } from "../../../base/chain/IChainInterface";
import { SolanaWallet } from "../../../providers/solana-provider";
import { useChain } from "../../hooks";
import { useWeb3Auth } from "../../hooks/useWeb3Auth";

export type IUseSolanaWallet = {
  accounts: string[] | null;
  solanaWallet: SolanaWallet | null;
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
  const { provider, web3Auth } = useWeb3Auth();
  const { chainNamespace } = useChain();
  const [accounts, setAccounts] = useState<string[] | null>(null);

  const solanaWallet = useMemo(() => {
    if (!provider) return null;
    if (chainNamespace !== CHAIN_NAMESPACES.SOLANA) return null;
    return new SolanaWallet(provider);
  }, [provider, chainNamespace]);

  const rpc = useMemo(() => {
    if (!web3Auth || !provider || chainNamespace !== CHAIN_NAMESPACES.SOLANA) return null;
    return createSolanaRpc(web3Auth.currentChain.rpcTarget);
  }, [web3Auth, provider, chainNamespace]);

  useEffect(() => {
    const init = async () => {
      if (chainNamespace !== CHAIN_NAMESPACES.SOLANA) {
        setAccounts(null);
        return;
      }
      if (!solanaWallet) return;
      const accts = await solanaWallet.getAccounts();
      if (accts?.length > 0) {
        setAccounts(accts);
      }
    };

    if (solanaWallet) init();
  }, [solanaWallet, chainNamespace]);

  return { solanaWallet, accounts, rpc };
};
