import { useConnectorClient } from "@wagmi/vue";
import { createWalletClient, custom, WalletClient } from "viem";

import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { createEvmX402Fetch, createSolanaX402Fetch } from "../../base/x402/x402";
import { useSolanaWallet } from "../solana/composables/useSolanaWallet";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

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
 * Wagmi/Solana-integrated x402 fetch composable.
 *
 * Automatically selects the correct payment path based on the currently connected
 * chain namespace:
 *  - **Solana** – uses `createSolanaX402Fetch` backed by the web3auth Solana wallet.
 *  - **EVM** – uses `createEvmX402Fetch` backed by the wagmi connector client
 *    (the `@wagmi/vue` equivalent of wagmi React's `useWalletClient`).
 *
 * Callers do not need to pass a wallet client manually; it is sourced internally.
 */
export const useX402Fetch = (): IUseX402FetchReturnValues => {
  const { provider, chainId, chainNamespace } = useWeb3AuthInner();
  // useConnectorClient is the @wagmi/vue counterpart of useWalletClient in wagmi (React).
  // Both return a viem Client<Transport, Chain, Account> extended with wallet actions — i.e. a WalletClient.
  const { data: connectorClient } = useConnectorClient();
  const { solanaWallet, accounts } = useSolanaWallet();

  const fetchWithPayment = async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
    // ── Solana path ──────────────────────────────────────────────────────────
    if (chainNamespace.value === CHAIN_NAMESPACES.SOLANA) {
      if (!solanaWallet.value || !accounts.value?.[0]) throw new Error("Solana wallet not connected");
      const fetchFn = createSolanaX402Fetch(solanaWallet.value, accounts.value[0]);
      return fetchFn(url, options);
    }

    // ── EVM path (wagmi) ──────────────────────────────────────────────────────
    if (!provider.value || !chainId.value) throw new Error("Provider or chainId not found");

    // useConnectorClient returns viem Client. Reference: https://wagmi.sh/vue/api/composables/useConnectorClient
    const client = connectorClient.value as WalletClient | undefined;
    if (!client || !client.account?.address || !client.chain) throw new Error("Wallet not connected");

    const x402CompatibleClient = createWalletClient({
      account: client.account,
      chain: client.chain,
      transport: custom(provider.value),
    });

    const fetchWithX402Payment = createEvmX402Fetch(x402CompatibleClient);
    return fetchWithX402Payment(url, options);
  };

  return { fetchWithPayment };
};
