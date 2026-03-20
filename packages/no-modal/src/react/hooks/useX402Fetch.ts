import { useCallback, useMemo } from "react";
import { useWalletClient } from "wagmi";

import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { createEvmX402Fetch, createSolanaX402Fetch, IUseX402FetchParams, IUseX402FetchReturnValues } from "../../base/x402";
import { useSolanaWallet } from "../solana/hooks/useSolanaWallet";
import { useChain } from "./useChain";

export { createEvmX402Fetch, createSolanaX402Fetch };
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
    if (!solanaWallet || !accounts?.[0]) return null;
    return createSolanaX402Fetch(solanaWallet, accounts[0]);
  }, [solanaWallet, accounts]);

  const evmX402Fetch = useMemo(() => {
    if (!walletClient?.account?.address) return null;
    return createEvmX402Fetch(walletClient);
  }, [walletClient]);

  const x402Fetch = useMemo(() => {
    if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      return solanaX402Fetch;
    }
    return evmX402Fetch;
  }, [chainNamespace, solanaX402Fetch, evmX402Fetch]);

  const fetchWithPayment = useCallback(
    async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
      const x402FetchFn = x402Fetch;

      if (!x402FetchFn) throw new Error("Wallet not connected");

      return x402FetchFn(url, options);
    },
    [x402Fetch]
  );

  return { fetchWithPayment };
};
