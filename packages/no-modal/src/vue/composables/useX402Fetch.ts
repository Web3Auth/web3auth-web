import { useConnectorClient } from "@wagmi/vue";
import { createWalletClient, custom, WalletClient } from "viem";

import { createEvmX402Fetch, X402ChainMismatchError } from "../../base/x402/x402";
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

export { X402ChainMismatchError };

/**
 * Wagmi-integrated x402 fetch composable.
 *
 * Mirrors the React `useX402Fetch` hook: the connected wallet client is sourced
 * internally via `useConnectorClient` (the `@wagmi/vue` equivalent of wagmi React's
 * `useWalletClient`) so callers do not need to pass it manually.
 */
export const useX402Fetch = (): IUseX402FetchReturnValues => {
  const { provider, chainId } = useWeb3AuthInner();
  // useConnectorClient is the @wagmi/vue counterpart of useWalletClient in wagmi (React).
  // Both return a viem Client<Transport, Chain, Account> extended with wallet actions — i.e. a WalletClient.
  const { data: connectorClient } = useConnectorClient();

  const fetchWithPayment = async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
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
