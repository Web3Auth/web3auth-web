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
    if (chainNamespace !== CHAIN_NAMESPACES.SOLANA || !solanaWallet) {
      setAccounts(null);
      return;
    }
    const accts = solanaWallet.accounts.map((a) => a.address);
    if (accts.length > 0) setAccounts(accts);
  }, [solanaWallet, chainNamespace]);

  return { solanaWallet, accounts, rpc, getPrivateKey };
};
