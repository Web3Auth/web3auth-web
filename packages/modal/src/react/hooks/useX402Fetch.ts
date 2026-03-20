import { CHAIN_NAMESPACES } from "@web3auth/no-modal";
import {
  createEvmX402Fetch,
  createProviderBackedEvmSigner,
  createSolanaX402Fetch,
  getEvmAddress,
  type IUseX402FetchParams,
  type IUseX402FetchReturnValues,
} from "@web3auth/no-modal/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";

import { useSolanaWallet } from "../solana/hooks/useSolanaWallet";
import { useChain } from "./useChain";
import { useWeb3Auth } from "./useWeb3Auth";

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
  const { provider } = useWeb3Auth();
  const { solanaWallet, accounts } = useSolanaWallet();
  const [providerAddress, setProviderAddress] = useState<Address | null>(null);
  const evmAddress = address ?? providerAddress;

  useEffect(() => {
    let cancelled = false;

    if (!provider || chainNamespace !== CHAIN_NAMESPACES.EIP155) {
      setProviderAddress(null);
      return undefined;
    }

    if (address) {
      setProviderAddress(null);
      return undefined;
    }

    const handleAccountsChanged = (nextAccounts: string[]) => {
      if (!cancelled) {
        setProviderAddress((nextAccounts[0] as Address | undefined) ?? null);
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);

    (async () => {
      try {
        const nextAddress = await getEvmAddress(provider);
        if (!cancelled) setProviderAddress(nextAddress);
      } catch {
        if (!cancelled) setProviderAddress(null);
      }
    })();

    return () => {
      cancelled = true;
      provider.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [provider, chainNamespace, address]);

  const solanaX402Fetch = useMemo(() => {
    if (!solanaWallet || !accounts?.[0]) return null;
    return createSolanaX402Fetch(solanaWallet, accounts[0]);
  }, [solanaWallet, accounts]);

  const evmX402Fetch = useMemo(() => {
    if (!provider || !evmAddress) return null;
    const evmSigner = createProviderBackedEvmSigner(provider, evmAddress);
    return createEvmX402Fetch(evmSigner);
  }, [provider, evmAddress]);

  const x402Fetch = useMemo(() => {
    if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
      return solanaX402Fetch;
    }
    if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
      return evmX402Fetch;
    }
    return null;
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
