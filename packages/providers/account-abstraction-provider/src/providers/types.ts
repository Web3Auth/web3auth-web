import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";

export type BundlerConfig = {
  url: string;
} & Pick<Parameters<typeof createBundlerClient>[0], "key" | "name" | "cacheTime" | "pollingInterval" | "userOperation" | "rpcSchema"> &
  Partial<Pick<Parameters<typeof createBundlerClient>[0], "transport">>;

export type PaymasterConfig = {
  url: string;
} & Pick<Parameters<typeof createPaymasterClient>[0], "key" | "name" | "pollingInterval" | "rpcSchema" | "cacheTime"> &
  Partial<Pick<Parameters<typeof createPaymasterClient>[0], "transport">>;
