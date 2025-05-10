"use client";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IWeb3AuthState } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";
import { Web3AuthProvider } from "@web3auth/modal/react";
// import { WagmiProvider } from "@web3auth/modal/react/wagmi";

// const queryClient = new QueryClient();
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
export default function Provider({ children, initialState }: { children: React.ReactNode, initialState: IWeb3AuthState | undefined }) {
  return (
    <Web3AuthProvider config={web3authConfig} initialState={initialState}>
      {/* <QueryClientProvider client={queryClient}> */}
        {/* <WagmiProvider> */}
          {children}
        {/* </WagmiProvider> */}
      {/* </QueryClientProvider> */}
    </Web3AuthProvider>
  );
}
