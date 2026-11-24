import { type Config, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";

export const defaultWagmiConfig: Config = createConfig({
  chains: [mainnet],
  connectors: [], // or your basic wallets
  ssr: true,
  transports: {
    [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
  },
});
