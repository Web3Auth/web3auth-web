import type { SolanaClient } from "@solana/client";
import type { InjectionKey, Ref } from "vue";

export const SOLANA_CLIENT_KEY: InjectionKey<Ref<SolanaClient | null>> = Symbol("SolanaClient");
