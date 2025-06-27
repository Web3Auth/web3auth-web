import { CreateConfigParameters, http } from "wagmi";
import { mainnet } from "wagmi/chains";

export const defaultWagmiConfig: CreateConfigParameters = {
  chains: [mainnet],
  connectors: [], // or your basic wallets
  ssr: true,
  transports: {
    [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
  },
};
