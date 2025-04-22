import type { CreateConfigParameters, WagmiProviderProps as WagmiProviderPropsBase } from "wagmi";

export type WagmiProviderProps = Omit<WagmiProviderPropsBase, "config"> & {
  config?: Partial<CreateConfigParameters>;
};
