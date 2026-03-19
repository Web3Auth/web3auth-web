import { CHAIN_NAMESPACES } from "@web3auth/no-modal";
import { createEvmX402Fetch, createSolanaX402Fetch, X402ChainMismatchError } from "@web3auth/no-modal/react";
import { useCallback } from "react";
import { useWalletClient } from "wagmi";

import { useSolanaWallet } from "../solana/hooks/useSolanaWallet";
import { useChain } from "./useChain";

export type { IUseX402FetchParams, IUseX402FetchReturnValues } from "@web3auth/no-modal/react";
export { X402ChainMismatchError };

/**
 * Wagmi/Solana-integrated x402 fetch hook (modal context).
 *
 * Automatically selects the correct payment path based on the currently connected
 * chain namespace:
 *  - **Solana** – uses `createSolanaX402Fetch` backed by the web3auth Solana wallet.
 *  - **EVM** – uses `createEvmX402Fetch` backed by the wagmi wallet client.
 *
 * Uses the `@web3auth/modal` React context. Callers do not need to pass a wallet
 * client manually; it is sourced internally.
 */
export const useX402Fetch = () => {
  const { chainNamespace } = useChain();
  const { data: walletClient } = useWalletClient();
  const { solanaWallet, accounts } = useSolanaWallet();

  const fetchWithPayment = useCallback(
    async ({ url, options }: { url: string; options?: RequestInit }): Promise<Response> => {
      // ── Solana path ──────────────────────────────────────────────────────
      if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
        if (!solanaWallet || !accounts?.[0]) throw new Error("Solana wallet not connected");
        const fetchFn = createSolanaX402Fetch(solanaWallet, accounts[0]);
        return fetchFn(url, options);
      }

      // ── EVM path (wagmi) ─────────────────────────────────────────────────
      if (!walletClient?.account?.address) return null;
      const fetchWithX402Payment = createEvmX402Fetch(walletClient);
      return fetchWithX402Payment(url, options);
    },
    [chainNamespace, walletClient, solanaWallet, accounts]
  );

  return { fetchWithPayment };
};
