import { SolanaClient } from "@solana/client";
import { inject, Ref, ref } from "vue";

import { SOLANA_CLIENT_KEY } from "../constants";

/**
 * Injects the Solana Framework Kit client when inside SolanaProvider and Web3Auth is connected on Solana.
 * Otherwise returns null.
 */
export function useSolanaClient(): Ref<SolanaClient | null> {
  return inject(SOLANA_CLIENT_KEY, ref<SolanaClient | null>(null));
}
