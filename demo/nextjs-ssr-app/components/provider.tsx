"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IWeb3AuthState } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";

const queryClient = new QueryClient();
const clientId = "BMjGyXu-SceWBNiPxfQK6qRlnVOzYLX5YNgI8yrgd1F9_pfAWyMUWfyt2Yr45CYlOs92cJh0C02M2hJonVb_zC0";

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId,
    ssr: true,
    chains: [
      {
        chainNamespace: "eip155",
        chainId: "0xaa36a7", // Sepolia – supports EIP-7702
        rpcTarget: "https://sepolia.infura.io/v3/4efda295156d477f959dcef8ebc33c5f",
        displayName: "Ethereum Sepolia",
        ticker: "ETH",
        tickerName: "Ethereum",
        blockExplorerUrl: "https://sepolia.etherscan.io",
        logo: "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg",
      },
    ],
    defaultChainId: "0xaa36a7",
    walletServicesConfig: {
      confirmationStrategy: "modal",
      loginMode: "plugin",
      walletUrls: {
        production: {
          url: "http://localhost:4050",
        },
      },
    },
  },
};

export default function Provider({
  children,
  web3authInitialState,
}: {
  children: React.ReactNode;
  web3authInitialState: IWeb3AuthState | undefined;
}) {
  return (
    <Web3AuthProvider config={web3authConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>{children}</WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
