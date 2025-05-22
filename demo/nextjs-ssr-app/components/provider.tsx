"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IWeb3AuthState } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";

const queryClient = new QueryClient();
const clientId = "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw";

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId,
    authBuildEnv: "testing",
    ssr: true,
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
