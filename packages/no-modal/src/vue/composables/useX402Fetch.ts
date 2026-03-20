import type { Address } from "viem";
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from "vue";

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
import { useWeb3AuthInner } from "./useWeb3AuthInner";

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
  const { provider, chainNamespace } = useWeb3AuthInner();
  const { solanaWallet, accounts } = useSolanaWallet();
  const providedAddress = computed(() => toValue(address) ?? null);
  const providerAddress = ref<Address | null>(null);
  const evmAddress = computed(() => providedAddress.value ?? providerAddress.value);

  watch(
    [provider, chainNamespace, providedAddress],
    ([nextProvider, nextChainNamespace, nextProvidedAddress], _, onInvalidate) => {
      let active = true;

      if (!nextProvider || nextChainNamespace !== CHAIN_NAMESPACES.EIP155) {
        providerAddress.value = null;
        return;
      }

      if (nextProvidedAddress) {
        providerAddress.value = null;
        return;
      }

      const handleAccountsChanged = (nextAccounts: string[]) => {
        if (active) {
          providerAddress.value = (nextAccounts[0] as Address | undefined) ?? null;
        }
      };

      nextProvider.on("accountsChanged", handleAccountsChanged);

      void (async () => {
        try {
          const nextAddress = await getEvmAddress(nextProvider);
          if (active) providerAddress.value = nextAddress;
        } catch {
          if (active) providerAddress.value = null;
        }
      })();

      onInvalidate(() => {
        active = false;
        nextProvider.removeListener("accountsChanged", handleAccountsChanged);
      });
    },
    { immediate: true }
  );

  const evmX402Fetch = computed(() => {
    if (!provider.value || !evmAddress.value) return null;
    const evmSigner = createProviderBackedEvmSigner(provider.value, evmAddress.value);
    return createEvmX402Fetch(evmSigner);
  });

  const solanaX402Fetch = computed(() => {
    if (!solanaWallet.value || !accounts.value?.[0]) return null;
    return createSolanaX402Fetch(solanaWallet.value, accounts.value[0]);
  });

  const x402Fetch = computed(() => {
    if (chainNamespace.value === CHAIN_NAMESPACES.SOLANA) {
      return solanaX402Fetch.value;
    }
    if (chainNamespace.value === CHAIN_NAMESPACES.EIP155) {
      return evmX402Fetch.value;
    }
    return null;
  });

  const fetchWithPayment = async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
    const x402FetchFn = x402Fetch?.value;

    if (!x402FetchFn) throw new Error("Wallet not connected");
    return x402FetchFn(url, options);
  };

  return { fetchWithPayment };
};
