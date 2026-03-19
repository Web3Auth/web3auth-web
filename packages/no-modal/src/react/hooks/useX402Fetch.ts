import { useCallback } from "react";
import { useWalletClient } from "wagmi";

import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { createEvmX402Fetch, createSolanaX402Fetch, ISolanaX402Wallet, X402ChainMismatchError } from "../../base/x402/x402";
import { useSolanaWallet } from "../solana/hooks/useSolanaWallet";
import { useChain } from "./useChain";

export { createEvmX402Fetch, createSolanaX402Fetch, X402ChainMismatchError };
export type { ISolanaX402Wallet };

export interface IUseX402FetchParams {
  /** The URL to send the payment-gated request to. */
  url: string;
  /** Optional fetch init options (method, headers, body, etc.). */
  options?: RequestInit;
}

export interface IUseX402FetchReturnValues {
  /** Trigger the payment-gated fetch. Resolves with the raw `Response` — callers are responsible for reading and parsing the body. */
  fetchWithPayment: (params: IUseX402FetchParams) => Promise<Response>;
}

/**
 * Wagmi/Solana-integrated x402 fetch hook.
 *
 * Automatically selects the correct payment path based on the currently connected
 * chain namespace:
 *  - **Solana** – uses `createSolanaX402Fetch` backed by the web3auth Solana wallet.
 *  - **EVM** – uses `createEvmX402Fetch` backed by the wagmi wallet client.
 *
 * Callers do not need to pass a wallet client manually; it is sourced internally.
 */
export const useX402Fetch = (): IUseX402FetchReturnValues => {
  const { chainNamespace } = useChain();
  const { data: walletClient } = useWalletClient();
  const { solanaWallet, accounts } = useSolanaWallet();

  const fetchWithPayment = useCallback(
    async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
      // ── Solana path ────────────────────────────────────────────────────────
      if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
        if (!solanaWallet || !accounts?.[0]) throw new Error("Solana wallet not connected");
        const fetchFn = createSolanaX402Fetch(solanaWallet, accounts[0]);
        return fetchFn(url, options);
      }

      // ── EVM path (wagmi) ───────────────────────────────────────────────────
      if (!walletClient?.account?.address) return null;
      const fetchWithX402Payment = createEvmX402Fetch(walletClient);
      return fetchWithX402Payment(url, options);
    },
    [chainNamespace, walletClient, solanaWallet, accounts]
  );

  return { fetchWithPayment };
};
