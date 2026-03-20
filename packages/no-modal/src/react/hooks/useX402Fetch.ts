import { useCallback, useMemo } from "react";
import { useWalletClient } from "wagmi";

import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { createEvmX402Fetch, createSolanaX402Fetch, IUseX402FetchParams, IUseX402FetchReturnValues, X402ChainMismatchError } from "../../base/x402";
import { useSolanaWallet } from "../solana/hooks/useSolanaWallet";
import { useChain } from "./useChain";

export { createEvmX402Fetch, createSolanaX402Fetch, X402ChainMismatchError };
export type { IUseX402FetchParams, IUseX402FetchReturnValues };

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

  const solanaX402Fetch = useMemo(() => {
    if (!solanaWallet || !accounts?.[0]) throw new Error("Solana wallet not connected");
    return createSolanaX402Fetch(solanaWallet, accounts[0]);
  }, [solanaWallet, accounts]);

  const evmX402Fetch = useMemo(() => {
    if (!walletClient?.account?.address) throw new Error("EVM wallet not connected");
    return createEvmX402Fetch(walletClient);
  }, [walletClient]);

  const fetchWithPayment = useCallback(
    async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
      // ── Solana path ────────────────────────────────────────────────────────
      if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
        return solanaX402Fetch(url, options);
      }

      // ── EVM path (wagmi) ───────────────────────────────────────────────────
      return evmX402Fetch(url, options);
    },
    [chainNamespace, solanaX402Fetch, evmX402Fetch]
  );

  return { fetchWithPayment };
};
