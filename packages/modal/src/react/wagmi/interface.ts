import type { CreateConfigParameters, WagmiProviderProps as WagmiProviderPropsBase } from "wagmi";

export type WagmiProviderProps = Omit<WagmiProviderPropsBase, "config"> & {
  config?: Omit<CreateConfigParameters, "chains" | "connectors" | "transports" | "multiInjectedProviderDiscovery" | "client">;
};
