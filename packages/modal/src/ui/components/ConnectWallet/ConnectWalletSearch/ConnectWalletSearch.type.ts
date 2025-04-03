import type { FormEvent } from "react";

export interface ConnectWalletSearchProps {
  totalExternalWalletCount: number;
  isLoading: boolean;
  walletSearch: string;
  handleWalletSearch: (e: FormEvent<HTMLInputElement>) => void;
}
