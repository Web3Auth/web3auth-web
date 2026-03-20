import { useConnectorClient } from "@wagmi/vue";
import { createWalletClient, custom, WalletClient } from "viem";
import { computed } from "vue";

import { CHAIN_NAMESPACES } from "../../base/chain/IChainInterface";
import { createEvmX402Fetch, createSolanaX402Fetch, IUseX402FetchParams, IUseX402FetchReturnValues } from "../../base/x402";
import { useSolanaWallet } from "../solana/composables/useSolanaWallet";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export { createEvmX402Fetch, createSolanaX402Fetch };
export type { IUseX402FetchParams, IUseX402FetchReturnValues };

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

  const evmX402Fetch = computed(() => {
    if (!provider.value || !chainId.value) throw new Error("Provider or chainId not found");
    const client = connectorClient.value as WalletClient | undefined;
    if (!client || !client.account?.address || !client.chain) throw new Error("Wallet not connected");

    const x402CompatibleClient = createWalletClient({
      account: client.account,
      chain: client.chain,
      transport: custom(provider.value),
    });

    return createEvmX402Fetch(x402CompatibleClient);
  });

  const solanaX402Fetch = computed(() => {
    if (!solanaWallet.value || !accounts.value?.[0]) throw new Error("Solana wallet not connected");
    return createSolanaX402Fetch(solanaWallet.value, accounts.value[0]);
  });

  const x402Fetch = computed(() => {
    if (chainNamespace.value === CHAIN_NAMESPACES.SOLANA) {
      return solanaX402Fetch.value;
    }
    return evmX402Fetch.value;
  });

  const fetchWithPayment = async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
    const x402FetchFn = x402Fetch.value;
    return x402FetchFn(url, options);
  };

  return { fetchWithPayment };
};
