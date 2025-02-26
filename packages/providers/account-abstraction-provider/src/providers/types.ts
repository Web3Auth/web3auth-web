import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";

type Transport = Parameters<typeof createBundlerClient>[0]["transport"];

export type BundlerConfig = Omit<Parameters<typeof createBundlerClient>[0], "account" | "client" | "transport" | "paymaster"> &
  ({ url: string; transport?: Transport } | { url?: string; transport: Transport });

export type PaymasterConfig = Omit<Parameters<typeof createPaymasterClient>[0], "transport"> &
  ({ url: string; transport?: Transport } | { url?: string; transport: Transport });
