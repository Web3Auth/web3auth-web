import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";
import type { Wallet } from "@wallet-standard/base";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";
import { Ref, ref, ShallowRef, shallowRef, watch } from "vue";

import { CHAIN_NAMESPACES } from "../../../base/chain/IChainInterface";
import { WALLET_CONNECTORS } from "../../../base/wallet";
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
  /**
   * Returns the Solana ed25519 private key. Only works with the Auth connector.
   * @throws Error if connected via a non-Auth connector or if the provider is unavailable.
   */
  getPrivateKey: () => Promise<string>;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { connection, web3Auth } = useWeb3Auth();
  const { chainNamespace } = useChain();
  const accounts = ref<string[] | null>(null);
  const solanaWallet = shallowRef<Wallet | null>(null);
  const rpc = shallowRef<Rpc<SolanaRpcApi> | null>(null);

  const setupWallet = () => {
    const wallet = connection.value?.solanaWallet ?? null;
    if (!wallet) return;

    solanaWallet.value = wallet;
    const accts = wallet.accounts.map((a) => a.address);
    if (accts.length > 0) accounts.value = accts;
    if (web3Auth.value?.currentChain?.rpcTarget && chainNamespace.value === CHAIN_NAMESPACES.SOLANA) {
      rpc.value = createSolanaRpc(web3Auth.value.currentChain.rpcTarget);
    }
  };

  const resetWallet = () => {
    solanaWallet.value = null;
    accounts.value = null;
    rpc.value = null;
  };

  const getPrivateKey = async (): Promise<string> => {
    if (!web3Auth.value) throw new Error("Web3Auth not initialized");
    if (connection.value?.connectorName !== WALLET_CONNECTORS.AUTH) {
      throw new Error("getPrivateKey is only supported with the Auth connector");
    }
    const provider = web3Auth.value.connectedConnector?.provider;
    if (!provider) throw new Error("Provider not available");
    const privateKey = await provider.request<never, string>({ method: SOLANA_METHOD_TYPES.SOLANA_PRIVATE_KEY });
    if (!privateKey) throw new Error("Failed to retrieve private key");
    return privateKey;
  };

  watch(
    [connection, chainNamespace],
    ([newConnection, newChainNamespace]) => {
      if (!newConnection?.solanaWallet) {
        if (solanaWallet.value) resetWallet();
        return;
      }
      // setup wallet if not setup or chain namespace is changed to solana
      if (!solanaWallet.value || newChainNamespace === CHAIN_NAMESPACES.SOLANA) setupWallet();
    },
    { immediate: true }
  );

  return { solanaWallet, accounts, rpc, getPrivateKey };
};
