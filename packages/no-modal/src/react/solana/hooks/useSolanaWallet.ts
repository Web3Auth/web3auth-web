import { useEffect, useMemo, useState } from "react";

import { SolanaWallet } from "@/core/solana-provider";

import { useWeb3Auth } from "../../hooks/useWeb3Auth";

export type IUseSolanaWallet = {
  address: string[] | null;
  solanaWallet: SolanaWallet | null;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { provider } = useWeb3Auth();
  const [address, setAddress] = useState<string[] | null>(null);

  const solanaWallet = useMemo(() => {
    if (!provider) return null;
    return new SolanaWallet(provider);
  }, [provider]);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!solanaWallet) return;
      const accounts = await solanaWallet.requestAccounts();
      if (accounts?.length > 0) {
        setAddress(accounts);
      }
    };

    if (solanaWallet) fetchAccounts();
  }, [solanaWallet]);

  return { solanaWallet, address };
};
