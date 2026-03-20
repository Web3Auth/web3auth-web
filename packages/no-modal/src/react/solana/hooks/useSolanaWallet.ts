import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import type { Wallet } from "@wallet-standard/base";
import type { StandardConnectFeature } from "@wallet-standard/features";
import { StandardConnect } from "@wallet-standard/features";
import { useEffect, useMemo, useState } from "react";

import { CHAIN_NAMESPACES } from "../../../base/chain/IChainInterface";
import { createWeb3AuthWalletStandardWallet } from "../../../solana-framework-kit/web3authWalletStandardAdapter";
import { useChain } from "../../hooks";
import { useWeb3Auth } from "../../hooks/useWeb3Auth";

export type IUseSolanaWallet = {
  accounts: string[] | null;
  /**
   * Wallet Standard wallet backed by Web3Auth’s Solana provider (for Framework Kit and feature-based signing).
   */
  wallet: Wallet | null;
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

  const wallet = useMemo(() => {
    if (!provider) return null;
    if (chainNamespace !== CHAIN_NAMESPACES.SOLANA) return null;
    const chainConfig = web3Auth?.currentChain;
    if (!chainConfig) return null;
    return createWeb3AuthWalletStandardWallet({ provider, chainConfig });
  }, [provider, chainNamespace, web3Auth?.currentChain]);

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
      if (!wallet) return;
      const connectApi = wallet.features[StandardConnect] as StandardConnectFeature[typeof StandardConnect] | undefined;
      const connect = connectApi?.connect;
      if (!connect) return;
      try {
        const { accounts: accts } = await connect();
        const addrs = accts.map((a) => a.address);
        setAccounts(addrs.length > 0 ? addrs : null);
      } catch {
        setAccounts(null);
      }
    };

    if (wallet) void init();
  }, [wallet, chainNamespace]);

  return { wallet, accounts, rpc };
};
