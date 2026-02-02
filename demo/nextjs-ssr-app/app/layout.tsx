import "./globals.css";

import { Inter } from "next/font/google";

import Provider from "@/components/provider";
import { cookieToWeb3AuthState } from "@web3auth/modal";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Web3Auth NextJS Quick Start",
  description: "Web3Auth NextJS Quick Start",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const web3authInitialState = cookieToWeb3AuthState(((await headers())).get('cookie'))
  console.log("web3authInitialState", web3authInitialState)
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider web3authInitialState={web3authInitialState}>{children}</Provider>
      </body>
    </html>
  );
}
