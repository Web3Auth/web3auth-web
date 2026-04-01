import { useCallback } from "react";
import { Address } from "viem";

import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import type { IUseX402FetchParams, IUseX402FetchReturnValues } from "../../base/x402";
import { createEvmX402Fetch, createProviderBackedEvmSigner, createSolanaX402Fetch, getEvmAddress } from "../../base/x402";
import { useSolanaWallet } from "../solana/hooks/useSolanaWallet";
import { useChain } from "./useChain";
import { useWeb3Auth } from "./useWeb3Auth";

export { createEvmX402Fetch, createProviderBackedEvmSigner, createSolanaX402Fetch, getEvmAddress };
export type { IUseX402FetchParams, IUseX402FetchReturnValues };

/**
 * Web3Auth-integrated x402 fetch hook.
 *
 * Automatically selects the correct payment path based on the currently connected
 * chain namespace:
 *  - **Solana** – uses `createSolanaX402Fetch` backed by the web3auth Solana wallet.
 *  - **EVM** – uses `createEvmX402Fetch` backed by the web3auth EIP-1193 provider.
 *
 * Callers do not need to pass a signer manually; it is sourced internally.
 * When `address` is provided, it takes precedence over the provider's active account.
 */
export const useX402Fetch = (address?: Address): IUseX402FetchReturnValues => {
  const { chainNamespace } = useChain();
  const { web3Auth, isConnected } = useWeb3Auth();
  const { solanaWallet, accounts } = useSolanaWallet();

  const fetchWithPayment = useCallback(
    async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
      if (!isConnected) throw new Error("Wallet not connected");

      if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
        if (!solanaWallet || !accounts?.[0]) throw new Error("Solana wallet not available");
        return createSolanaX402Fetch(solanaWallet, accounts[0])(url, options);
      }

      if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
        const provider = web3Auth.connectedConnector?.provider;
        if (!provider) throw new Error("EVM provider not available");

        const evmAddress = address ?? (await getEvmAddress(provider));
        if (!evmAddress) throw new Error("EVM address not available");

        const signer = createProviderBackedEvmSigner(provider, evmAddress);
        return createEvmX402Fetch(signer)(url, options);
      }

      throw new Error("Unsupported chain namespace");
    },
    [web3Auth, isConnected, chainNamespace, address, solanaWallet, accounts]
  );

  return { fetchWithPayment };
};
