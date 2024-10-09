import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";

export type BundlerConfig = {
  url: string;
} & Omit<Parameters<typeof createBundlerClient>[0], "account" | "client" | "transport" | "paymaster"> &
  Partial<Pick<Parameters<typeof createBundlerClient>[0], "transport">>;

export type PaymasterConfig = {
  url: string;
} & Omit<Parameters<typeof createPaymasterClient>[0], "transport"> &
  Partial<Pick<Parameters<typeof createPaymasterClient>[0], "transport">>;
