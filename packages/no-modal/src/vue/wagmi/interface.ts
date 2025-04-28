import type { CreateConfigParameters, WagmiPluginOptions } from "@wagmi/vue";

export type WagmiProviderProps = Omit<WagmiPluginOptions, "config"> & {
  config?: Omit<CreateConfigParameters, "chains" | "connectors" | "transports" | "multiInjectedProviderDiscovery" | "client">;
};
