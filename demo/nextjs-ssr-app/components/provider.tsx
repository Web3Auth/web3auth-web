"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IWeb3AuthState } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { Web3AuthProvider } from "@web3auth/modal/react";
import { WagmiProvider } from "@web3auth/modal/react/wagmi";
import { State } from "wagmi";

const queryClient = new QueryClient();
const clientId = "BKZDJP0ouZP0PtfQYssMiezINbUwnIthw6ClTtTICvh0MCRgAxi5GJbHKH9cjM6xyWxe73c6c94ASCTxbGNLUt8";

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId,
    authBuildEnv: "testing",
    ssr: true
  },
};
export default function Provider({ children, web3authInitialState, wagmiInitialState }: { children: React.ReactNode, web3authInitialState: IWeb3AuthState | undefined, wagmiInitialState: State | undefined }) {
  return (
    <Web3AuthProvider config={web3authConfig} initialState={web3authInitialState}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider initialState={wagmiInitialState}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </Web3AuthProvider>
  );
}
