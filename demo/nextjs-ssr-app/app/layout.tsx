import "./globals.css";

import { Inter } from "next/font/google";

import Provider from "@/components/provider";
import { cookieToInitialState } from "@web3auth/no-modal";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Web3Auth NextJS Quick Start",
  description: "Web3Auth NextJS Quick Start",
};

// eslint-disable-next-line no-undef
export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("headers", headers().get("cookie"))
  const initialState = cookieToInitialState((headers()).get('cookie'))
  console.log("initialState", initialState)
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider initialState={initialState}>{children}</Provider>
      </body>
    </html>
  );
}
