import "./globals.css";

import { Inter } from "next/font/google";

import Provider from "@/components/provider";
import { cookieToWeb3AuthState } from "@web3auth/modal";
import { headers } from "next/headers";
import { cookieToWagmiState } from "@web3auth/modal/react/wagmi";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Web3Auth NextJS Quick Start",
  description: "Web3Auth NextJS Quick Start",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const web3authInitialState = cookieToWeb3AuthState((headers()).get('cookie'))
  const wagmiInitialState = cookieToWagmiState((headers()).get('cookie'))
  console.log("web3authInitialState", web3authInitialState);
  console.log("wagmiInitialState", wagmiInitialState);
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider web3authInitialState={web3authInitialState} wagmiInitialState={wagmiInitialState}>{children}</Provider>
      </body>
    </html>
  );
}
