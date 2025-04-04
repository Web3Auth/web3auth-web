import type { FormEvent } from "react";

import type { ButtonRadiusType } from "../../../interfaces";

export interface ConnectWalletSearchProps {
  totalExternalWalletCount: number;
  isLoading: boolean;
  walletSearch: string;
  handleWalletSearch: (e: FormEvent<HTMLInputElement>) => void;
  buttonRadius: ButtonRadiusType;
}
