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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initialState = cookieToWeb3AuthState((headers()).get('cookie'))
  console.log("initialState", initialState)
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider initialState={initialState}>{children}</Provider>
      </body>
    </html>
  );
}
