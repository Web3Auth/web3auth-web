import { CHAIN_NAMESPACES } from "@web3auth/no-modal";
import type { IUseX402FetchParams, IUseX402FetchReturnValues } from "@web3auth/no-modal/react";
import { createEvmX402Fetch, createSolanaX402Fetch } from "@web3auth/no-modal/react";
import { useCallback } from "react";
import { useWalletClient } from "wagmi";

import { useSolanaWallet } from "../solana/hooks/useSolanaWallet";
import { useChain } from "./useChain";

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

  const fetchWithPayment = useCallback(
    async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
      let x402FetchFn: typeof fetch;
      if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
        if (!solanaWallet || !accounts?.[0]) throw new Error("Solana wallet not connected");
        x402FetchFn = createSolanaX402Fetch(solanaWallet, accounts[0]);
      }
      if (!walletClient?.account?.address) throw new Error("EVM wallet not connected");
      x402FetchFn = createEvmX402Fetch(walletClient);
      return x402FetchFn(url, options);
    },
    [accounts, chainNamespace, solanaWallet, walletClient]
  );

  return { fetchWithPayment };
};
