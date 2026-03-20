import type { SolanaClient } from "@solana/client";
import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import { computed, onScopeDispose, Ref, ref, shallowRef, watch } from "vue";

import { CHAIN_NAMESPACES } from "../../../base/chain/IChainInterface";
import { useChain, useWeb3Auth } from "../../composables";
import { useSolanaClient } from "./useSolanaClient";

/** Public API: only accounts, client, rpc. Signing is via useSignTransaction / useSignMessage / useSignAndSendTransaction. */
export type IUseSolanaWallet = {
  /** Connected account addresses (base58). From Framework Kit session when available. */
  accounts: Ref<string[] | null>;
  /** Solana Framework Kit client for actions (fetchBalance, etc.) and watchers. */
  client: Ref<SolanaClient | null>;
  /**
   * Solana RPC for building transactions (e.g. getLatestBlockhash). From \@solana/kit for compatibility.
   */
  rpc: Ref<Rpc<SolanaRpcApi> | null>;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const solanaClientRef = useSolanaClient();
  const { web3Auth } = useWeb3Auth();
  const { chainNamespace } = useChain();

  const accounts = ref<string[] | null>(null);
  const rpc = shallowRef<Rpc<SolanaRpcApi> | null>(null);

  const isSolana = computed(() => chainNamespace.value === CHAIN_NAMESPACES.SOLANA);

  watch(
    [solanaClientRef, isSolana],
    ([_, isSol]) => {
      if (!isSol || !web3Auth.value?.currentChain?.rpcTarget) {
        rpc.value = null;
        return;
      }
      rpc.value = createSolanaRpc(web3Auth.value.currentChain.rpcTarget);
    },
    { immediate: true }
  );

  watch(
    solanaClientRef,
    (client) => {
      if (!client) {
        accounts.value = null;
        return;
      }

      const update = () => {
        const state = client.store.getState();
        const wallet = state.wallet;
        if (wallet.status === "connected" && wallet.session) {
          const addr = wallet.session.account.address;
          accounts.value = [addr];
        } else {
          accounts.value = null;
        }
      };

      update();
      const unsub = client.store.subscribe(update);
      onScopeDispose(() => unsub());
    },
    { immediate: true }
  );

  return {
    accounts,
    client: solanaClientRef,
    rpc,
  };
};
