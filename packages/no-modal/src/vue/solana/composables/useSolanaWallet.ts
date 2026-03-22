import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import type { Wallet } from "@wallet-standard/base";
import { computed, Ref, ref, ShallowRef, shallowRef, watch } from "vue";

import { CHAIN_NAMESPACES } from "../../../base/chain/IChainInterface";
import { useChain, useWeb3Auth } from "../../composables";

export type IUseSolanaWallet = {
  accounts: Ref<string[] | null>;
  solanaWallet: ShallowRef<Wallet | null>;
  /**
   * Solana RPC client for making RPC calls.
   * @example
   * ```typescript
   * const { value: balance } = await rpc.value.getBalance(address("...")).send();
   * const { value: latestBlockhash } = await rpc.value.getLatestBlockhash().send();
   * ```
   */
  rpc: ShallowRef<Rpc<SolanaRpcApi> | null>;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { connection, web3Auth } = useWeb3Auth();
  const { chainNamespace } = useChain();
  const accounts = ref<string[] | null>(null);
  const solanaWallet = shallowRef<Wallet | null>(null);
  const rpc = shallowRef<Rpc<SolanaRpcApi> | null>(null);

  const isSolana = computed(() => chainNamespace.value === CHAIN_NAMESPACES.SOLANA);

  const setupWallet = () => {
    if (!isSolana.value) return;
    const wallet = connection.value?.solanaWallet ?? null;
    if (!wallet) return;
    solanaWallet.value = wallet;
    const accts = wallet.accounts.map((a) => a.address);
    if (accts.length > 0) accounts.value = accts;
    if (web3Auth.value?.currentChain?.rpcTarget) {
      rpc.value = createSolanaRpc(web3Auth.value.currentChain.rpcTarget);
    }
  };

  const resetWallet = () => {
    solanaWallet.value = null;
    accounts.value = null;
    rpc.value = null;
  };

  watch(
    [connection, chainNamespace],
    ([newConnection, newChainNamespace]) => {
      if (!newConnection?.solanaWallet || newChainNamespace !== CHAIN_NAMESPACES.SOLANA) {
        if (solanaWallet.value) resetWallet();
        return;
      }
      if (!solanaWallet.value) setupWallet();
    },
    { immediate: true }
  );

  return { solanaWallet, accounts, rpc };
};
