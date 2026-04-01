import type { Address } from "viem";
import { type MaybeRefOrGetter, toValue } from "vue";

import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import {
  createEvmX402Fetch,
  createProviderBackedEvmSigner,
  createSolanaX402Fetch,
  getEvmAddress,
  type IUseX402FetchParams,
  type IUseX402FetchReturnValues,
} from "../../base/x402";
import { useSolanaWallet } from "../solana/composables/useSolanaWallet";
import { useWeb3Auth } from "./useWeb3Auth";

export { createEvmX402Fetch, createSolanaX402Fetch };
export type { IUseX402FetchParams, IUseX402FetchReturnValues };

/**
 * Web3Auth-integrated x402 fetch composable.
 *
 * Automatically selects the correct payment path based on the currently connected
 * chain namespace:
 *  - **Solana** – uses `createSolanaX402Fetch` backed by the web3auth Solana wallet.
 *  - **EVM** – uses `createEvmX402Fetch` backed by the web3auth EIP-1193 provider.
 *
 * Callers do not need to pass a signer manually; it is sourced internally.
 * When `address` is provided, it takes precedence over the provider's active account.
 */
export const useX402Fetch = (address?: MaybeRefOrGetter<Address | undefined>): IUseX402FetchReturnValues => {
  const { isConnected, web3Auth, chainNamespace } = useWeb3Auth();
  const { solanaWallet, accounts } = useSolanaWallet();

  const fetchWithPayment = async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
    if (!isConnected.value) throw new Error("Wallet not connected");

    if (chainNamespace.value === CHAIN_NAMESPACES.SOLANA) {
      if (!solanaWallet.value || !accounts.value?.[0]) throw new Error("Solana wallet not available");
      return createSolanaX402Fetch(solanaWallet.value, accounts.value[0])(url, options);
    }

    if (chainNamespace.value === CHAIN_NAMESPACES.EIP155) {
      const provider = web3Auth.value?.connectedConnector?.provider;
      if (!provider) throw new Error("EVM provider not available");

      const evmAddress = toValue(address) ?? (await getEvmAddress(provider));
      if (!evmAddress) throw new Error("EVM address not available");

      const signer = createProviderBackedEvmSigner(provider, evmAddress);
      return createEvmX402Fetch(signer)(url, options);
    }

    throw new Error("Unsupported chain namespace");
  };

  return { fetchWithPayment };
};
