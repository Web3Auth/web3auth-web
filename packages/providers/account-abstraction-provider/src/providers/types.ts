import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";

export type BundlerConfig = {
  url: string;
} & Pick<Parameters<typeof createBundlerClient>[0], "key" | "name" | "cacheTime" | "pollingInterval" | "userOperation" | "rpcSchema" | "transport">;

export type PaymasterConfig = {
  url: string;
} & Pick<Parameters<typeof createPaymasterClient>[0], "key" | "name" | "pollingInterval" | "rpcSchema" | "cacheTime" | "transport">;
