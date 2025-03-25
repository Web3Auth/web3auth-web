import { FormEvent } from "react";

export interface ConnectWalletSearchProps {
  totalExternalWallets: number;
  isLoading: boolean;
  walletSearch: string;
  handleWalletSearch: (e: FormEvent<HTMLInputElement>) => void;
}
